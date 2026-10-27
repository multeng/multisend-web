import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../app/query-client';
import { readinessQueryOptions } from './readiness-query';

const clients: ReturnType<typeof createQueryClient>[] = [];

function setup() {
  const client = createQueryClient();
  clients.push(client);
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.useRealTimers();
});

describe('readiness query lifecycle', () => {
  it('shares one pending request and keeps it alive while another observer remains', async () => {
    const fetchMock = vi.fn<
      (url: string, options: RequestInit) => Promise<Response>
    >(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const { wrapper } = setup();
    const first = renderHook(() => useQuery(readinessQueryOptions), {
      wrapper,
    });
    const second = renderHook(() => useQuery(readinessQueryOptions), {
      wrapper,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    first.unmount();
    expect(fetchMock.mock.calls[0]?.[1].signal?.aborted).toBe(false);
    second.unmount();
    expect(fetchMock.mock.calls[0]?.[1].signal?.aborted).toBe(true);
  });

  it('does not automatically retry a failed request', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('offline'));
    vi.stubGlobal('fetch', fetchMock);
    const { wrapper } = setup();
    const hook = renderHook(() => useQuery(readinessQueryOptions), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(hook.result.current.isError).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not retain readiness for a later mount', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"status":"ready"}'));
    vi.stubGlobal('fetch', fetchMock);
    const { wrapper, client } = setup();
    const first = renderHook(() => useQuery(readinessQueryOptions), {
      wrapper,
    });
    await waitFor(() => expect(first.result.current.data).toBe('ready'));
    first.unmount();
    await waitFor(() =>
      expect(client.getQueryData(['api', 'readiness'])).toBeUndefined(),
    );
    fetchMock.mockResolvedValue(
      new Response('{"status":"not_ready"}', { status: 503 }),
    );
    const second = renderHook(() => useQuery(readinessQueryOptions), {
      wrapper,
    });
    await waitFor(() => expect(second.result.current.data).toBe('not_ready'));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
