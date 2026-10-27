export async function getReadiness(
  signal: AbortSignal,
): Promise<'ready' | 'not_ready'> {
  signal.throwIfAborted();
  const deadline = new AbortController();
  const requestSignal = AbortSignal.any([signal, deadline.signal]);
  const timeout = setTimeout(() => {
    deadline.abort(
      new DOMException('Readiness request timed out', 'TimeoutError'),
    );
  }, 10_000);

  let onAbort = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    onAbort = () => reject(requestSignal.reason);
    requestSignal.addEventListener('abort', onAbort, { once: true });
  });

  try {
    return await Promise.race([requestReadiness(requestSignal), cancelled]);
  } finally {
    clearTimeout(timeout);
    requestSignal.removeEventListener('abort', onAbort);
  }
}

async function requestReadiness(
  signal: AbortSignal,
): Promise<'ready' | 'not_ready'> {
  const response = await fetch('/api/readyz', {
    signal,
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });

  if (response.status !== 200 && response.status !== 503) {
    throw new Error(`Unexpected readiness HTTP status: ${response.status}`);
  }

  const body: unknown = await response.json();
  if (typeof body === 'object' && body !== null && 'status' in body) {
    if (response.status === 200 && body.status === 'ready') return 'ready';
    if (response.status === 503 && body.status === 'not_ready')
      return 'not_ready';
  }

  throw new Error('Unexpected readiness response');
}
