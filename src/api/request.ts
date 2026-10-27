import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

type Options = {
  signal?: AbortSignal;
  method?: string;
  csrf?: string;
  body?: unknown;
};
const errorBody = z.object({
  error: z.object({
    code: z.enum([
      'invalid_request',
      'proof_invalid',
      'login_requires_reset',
      'unauthorized',
      'csrf_invalid',
      'origin_invalid',
      'rate_limited',
      'service_unavailable',
      'internal_error',
      'not_found',
      'conflict',
      'quota_exceeded',
    ]),
  }),
});

export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: Options = {},
): Promise<T> {
  options.signal?.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(
    () =>
      controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    10_000,
  );
  let rejectAbort = () => {};
  const cancelled = new Promise<never>((_, reject) => {
    rejectAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectAbort, { once: true });
  });
  async function perform() {
    const response = await fetch(path, {
      signal: controller.signal,
      credentials: 'same-origin',
      cache: 'no-store',
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined
          ? {}
          : { 'Content-Type': 'application/json' }),
        ...(options.csrf ? { 'X-CSRF-Token': options.csrf } : {}),
      },
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
    });
    if (response.status === 204 && response.ok) return schema.parse(undefined);
    const body: unknown = await response.json();
    if (!response.ok) {
      const parsed = errorBody.safeParse(body);
      throw new ApiError(
        response.status,
        parsed.success ? parsed.data.error.code : 'invalid_response',
      );
    }
    return schema.parse(body);
  }
  try {
    return await Promise.race([perform(), cancelled]);
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
    controller.signal.removeEventListener('abort', rejectAbort);
  }
}
