import { afterEach, describe, expect, it, vi } from 'vitest';
import { getReadiness } from './readiness';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

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
      signal: expect.any(AbortSignal),
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

  it('does not start a request with an already aborted signal', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"status":"ready"}'));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    await expect(getReadiness(controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cancels the HTTP request even when its transport ignores abort', async () => {
    const fetchMock = vi.fn<
      (url: string, options: RequestInit) => Promise<Response>
    >(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const rejected = vi.fn();
    void getReadiness(controller.signal).catch(rejected);
    controller.abort();
    expect(fetchMock.mock.calls[0]?.[1].signal?.aborted).toBe(true);
    await vi.waitFor(() =>
      expect(rejected).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AbortError' }),
      ),
    );
  });

  it('times out a stalled transport and ignores a late successful response', async () => {
    vi.useFakeTimers();
    let resolve!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            resolve = done;
          }),
      ),
    );
    const rejected = vi.fn();
    const fulfilled = vi.fn();
    const request = getReadiness(new AbortController().signal).then(
      fulfilled,
      rejected,
    );
    await vi.advanceTimersByTimeAsync(10_000);
    expect(rejected).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TimeoutError' }),
    );
    resolve(new Response('{"status":"ready"}'));
    await request;
    expect(fulfilled).not.toHaveBeenCalled();
  });

  it('includes stalled JSON body parsing in the deadline', async () => {
    vi.useFakeTimers();
    const response = new Response('{"status":"ready"}');
    vi.spyOn(response, 'json').mockReturnValue(new Promise(() => {}));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const rejected = vi.fn();
    void getReadiness(new AbortController().signal).catch(rejected);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(rejected).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TimeoutError' }),
    );
  });

  it('releases the deadline after a completed request', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"status":"ready"}')),
    );
    await expect(getReadiness(new AbortController().signal)).resolves.toBe(
      'ready',
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it('works in supported browsers without AbortSignal.any', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, 'any')!;
    Object.defineProperty(AbortSignal, 'any', {
      configurable: true,
      value: undefined,
    });
    try {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response('{"status":"ready"}'));
      vi.stubGlobal('fetch', fetchMock);
      await expect(getReadiness(new AbortController().signal)).resolves.toBe(
        'ready',
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(AbortSignal, 'any', descriptor);
    }
  });

  it('detaches caller cancellation after the request completes', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('{"status":"ready"}'));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    await expect(getReadiness(controller.signal)).resolves.toBe('ready');
    controller.abort();
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
  });
});
