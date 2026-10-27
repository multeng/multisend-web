import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

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

afterEach(() => vi.useRealTimers());

describe('App readiness', () => {
  it('shows checking while a request is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);
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
    render(<App />);
    expect(await screen.findByText(copy)).toBeVisible();
  });

  it('recovers from network failure using the keyboard', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(response());
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);
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
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Проверить снова' }));
    expect(fetchMock.mock.calls[0]?.[1].signal.aborted).toBe(true);
    await act(async () => second.resolve(response()));
    expect(screen.getByRole('status')).toHaveTextContent('API доступен');
    await act(async () => first.resolve(response(503, 'not_ready')));
    expect(screen.getByRole('status')).toHaveTextContent('API доступен');
  });

  it('cleans up StrictMode requests and cancels on unmount', async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal('fetch', fetchMock);
    const view = render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
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
    render(<App />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Нет соединения с API',
    );
    await act(async () => pending.resolve(response()));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Нет соединения с API',
    );
  });
});
