import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ApiError, request } from './request';

afterEach(() => vi.useRealTimers());

it('sends same-origin cookies and CSRF and validates the response', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal('fetch', fetcher);
  await expect(
    request('/api/example', z.object({ ok: z.boolean() }), {
      method: 'POST',
      csrf: 'nonce',
      body: { name: 'example' },
    }),
  ).resolves.toEqual({ ok: true });
  expect(fetcher.mock.calls[0]![1]).toMatchObject({
    credentials: 'same-origin',
    cache: 'no-store',
    method: 'POST',
    headers: { 'X-CSRF-Token': 'nonce' },
  });
  fetcher.mockResolvedValue(Response.json({ ok: 'false' }));
  await expect(
    request('/api/example', z.object({ ok: z.boolean() })),
  ).rejects.toThrow();
});

it('cancels even when fetch ignores cancellation and bounds JSON parsing', async () => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => new Promise(() => {}),
    }),
  );
  const pending = request('/api/example', z.unknown());
  const assertion = expect(pending).rejects.toMatchObject({
    name: 'TimeoutError',
  });
  await vi.advanceTimersByTimeAsync(10_000);
  await assertion;
  const controller = new AbortController();
  const cancelled = request('/api/example', z.unknown(), {
    signal: controller.signal,
  });
  const aborted = expect(cancelled).rejects.toMatchObject({
    name: 'AbortError',
  });
  controller.abort();
  await aborted;
});

it('returns a safe API code without exposing arbitrary server content', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        Response.json(
          { error: { code: 'unauthorized', message: 'secret' } },
          { status: 401 },
        ),
      ),
  );
  await expect(request('/api/example', z.unknown())).rejects.toEqual(
    new ApiError(401, 'unauthorized'),
  );
});
