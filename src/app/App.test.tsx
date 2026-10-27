import { StrictMode } from 'react';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createQueryClient } from './query-client';
import { readinessQueryOptions } from '../api/readiness-query';

const clients: ReturnType<typeof createQueryClient>[] = [];

function renderApp(element = <App />, strict = false) {
  const client = createQueryClient();
  clients.push(client);
  const tree = (
    <QueryClientProvider client={client}>{element}</QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

function ReadinessObserver() {
  const query = useQuery(readinessQueryOptions);
  return <output>{query.data}</output>;
}

function response(status = 200, body = 'ready') {
  return new Response(JSON.stringify({ status: body }), { status });
}

function deferred() {
  let resolve!: (value: Response) => void;
  const promise = new Promise<Response>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

afterEach(() => {
  clients.forEach((client) => client.clear());
  clients.length = 0;
  vi.useRealTimers();
});

describe('App readiness', () => {
  it('shows checking while a request is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    renderApp();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Проверяем соединение',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'выплаты',
    );
  });

  it.each([
    [200, 'ready', 'API доступен'],
    [503, 'not_ready', 'API пока не готов'],
    [200, 'unknown', 'Нет соединения с API'],
    [502, 'error', 'Нет соединения с API'],
  ])('renders HTTP %s / %s honestly', async (http, body, copy) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(http, body)));
    renderApp();
    expect(await screen.findByText(copy)).toBeVisible();
  });

  it('recovers from network failure using the keyboard', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('Нет соединения с API');
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Проверить снова' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText('API доступен')).toBeVisible();
  });

  it('aborts the previous request and ignores its late result after retry', async () => {
    const first = deferred();
    const second = deferred();
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    vi.stubGlobal('fetch', fetchMock);
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Проверить снова' }));
    expect(fetchMock.mock.calls[0]?.[1].signal.aborted).toBe(true);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await act(async () => second.resolve(response()));
    await screen.findByText('API доступен');
    await act(async () => first.resolve(response(503, 'not_ready')));
    expect(screen.getByRole('status')).toHaveTextContent('API доступен');
  });

  it('cleans up StrictMode requests and cancels on unmount', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const view = renderApp(<App />, true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0]?.[1].signal?.aborted).toBe(true);
    expect(calls[1]?.[1].signal?.aborted).toBe(false);
    view.unmount();
    expect(calls[1]?.[1].signal?.aborted).toBe(true);
  });

  it('times out a stalled request and ignores a later success', async () => {
    vi.useFakeTimers();
    const pending = deferred();
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(pending.promise));
    renderApp();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_001);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Нет соединения с API',
    );
    await act(async () => pending.resolve(response()));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Нет соединения с API',
    );
  });

  it('shares its request with another Query observer', () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    renderApp(
      <>
        <App />
        <ReadinessObserver />
      </>,
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
