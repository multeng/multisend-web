import { act, render, screen, waitFor } from '@testing-library/react';
import { useSyncExternalStore } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthProvider';
import { useAuthController } from './context';

function State() {
  const controller = useAuthController();
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  return (
    <span>{state.session?.authenticated ? 'authenticated' : 'anonymous'}</span>
  );
}
it('rechecks on hidden-to-visible return, never on ordinary focus or visible events', async () => {
  const session = {
    authenticated: true,
    csrfToken: 'a'.repeat(43),
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      address: '0:' + '1'.repeat(64),
      network: '-3',
    },
  };
  const fetch = vi
    .fn()
    .mockImplementation(async () => new Response(JSON.stringify(session)));
  vi.stubGlobal('fetch', fetch);
  const visibility = vi
    .spyOn(document, 'visibilityState', 'get')
    .mockReturnValue('visible');
  const view = render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <State />
      </AuthProvider>
    </QueryClientProvider>,
  );
  await screen.findByText('authenticated');
  act(() => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(fetch).toHaveBeenCalledOnce();
  visibility.mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  visibility.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  expect(fetch.mock.calls[1]![0]).toBe('/api/auth/session');
  expect(fetch.mock.calls[1]![1]).toMatchObject({
    method: 'GET',
    cache: 'no-store',
  });
  await screen.findByText('authenticated');
  view.unmount();
  visibility.mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  visibility.mockReturnValue('visible');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(fetch).toHaveBeenCalledTimes(2);
});
