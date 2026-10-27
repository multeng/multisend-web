import { describe, expect, it, vi } from 'vitest';
import { getReadiness } from './readiness';

describe('getReadiness', () => {
  it.each([
    [200, 'ready'],
    [503, 'not_ready'],
  ] as const)('accepts HTTP %s with status %s', async (httpStatus, status) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ status }), { status: httpStatus }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;

    await expect(getReadiness(signal)).resolves.toBe(status);
    expect(fetchMock).toHaveBeenCalledWith('/api/readyz', {
      signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
  });

  it.each([
    [500, '{"status":"ready"}'],
    [201, '{"status":"ready"}'],
    [200, '{"status":"not_ready"}'],
    [503, '{"status":"ready"}'],
    [200, 'null'],
    [200, '[]'],
    [200, '{}'],
    [200, 'not json'],
  ])('rejects unexpected HTTP/body combination %s %s', async (status, body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(body, { status })),
    );
    await expect(getReadiness(new AbortController().signal)).rejects.toThrow();
  });

  it('propagates a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(getReadiness(new AbortController().signal)).rejects.toThrow(
      'offline',
    );
  });

  it('propagates cancellation', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    await expect(getReadiness(new AbortController().signal)).rejects.toBe(
      abort,
    );
  });
});
