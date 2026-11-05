import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { Theme } from '@radix-ui/themes';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LanguageSwitch } from '../../i18n/LanguageSwitch';
import { InstallApp } from './InstallApp';

function setup(standalone = false) {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('ru');
  const media = new EventTarget() as MediaQueryList;
  Object.defineProperty(media, 'matches', {
    value: standalone,
    writable: true,
  });
  vi.stubGlobal('matchMedia', () => media);
  const view = render(
    <Theme>
      <I18nProvider>
        <LanguageSwitch />
        <InstallApp />
      </I18nProvider>
    </Theme>,
  );
  return { ...view, event: userEvent.setup(), media };
}
function installEvent(prompt = vi.fn().mockResolvedValue(undefined)) {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(event, { prompt });
  act(() => window.dispatchEvent(event));
  return { event, prompt };
}
it('offers RU/EN manual instructions without invoking installation or fetching', () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  setup();
  expect(screen.getByText('Установить приложение')).toBeInTheDocument();
  expect(screen.getByText(/На экран «Домой»/)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Установить' }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  expect(screen.getByText('Install the app')).toBeInTheDocument();
  expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it('uses a browser prompt only on a click and consumes it once', async () => {
  const { event } = setup();
  fireEvent.click(screen.getByText('Установить приложение'));
  const prompt = vi.fn().mockResolvedValue(undefined);
  const intercepted = installEvent(prompt);
  expect(intercepted.event.defaultPrevented).toBe(true);
  expect(prompt).not.toHaveBeenCalled();
  await event.click(screen.getByRole('button', { name: 'Установить' }));
  expect(prompt).toHaveBeenCalledOnce();
  expect(
    screen.queryByRole('button', { name: 'Установить' }),
  ).not.toBeInTheDocument();
  expect(screen.getByText('Установить приложение')).toBeInTheDocument();
});
it('handles a rejected prompt without claiming successful installation', async () => {
  const { event } = setup();
  fireEvent.click(screen.getByText('Установить приложение'));
  installEvent(vi.fn().mockRejectedValue(new Error('browser detail')));
  await event.click(screen.getByRole('button', { name: 'Установить' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Используйте меню браузера для установки.',
  );
  expect(screen.queryByText('browser detail')).not.toBeInTheDocument();
});
it('hides after installation or standalone launch and removes listeners on unmount', () => {
  const { unmount, media } = setup();
  act(() => window.dispatchEvent(new Event('appinstalled')));
  expect(screen.queryByText('Установить приложение')).not.toBeInTheDocument();
  unmount();
  const after = new Event('beforeinstallprompt', { cancelable: true });
  Object.assign(after, { prompt: vi.fn() });
  window.dispatchEvent(after);
  expect(after.defaultPrevented).toBe(false);
  // A separately mounted instance recognizes display-mode on launch.
  setup(true);
  expect(screen.queryByText('Установить приложение')).not.toBeInTheDocument();
  expect(media).toBeDefined();
});

it('hides when the existing browser window changes to standalone mode', () => {
  const { media } = setup();
  expect(screen.getByText('Установить приложение')).toBeInTheDocument();
  act(() => {
    Object.assign(media, { matches: true });
    media.dispatchEvent(new Event('change'));
  });
  expect(screen.queryByText('Установить приложение')).not.toBeInTheDocument();
});
it('recognizes iOS standalone without assuming a browser user agent', () => {
  Object.defineProperty(navigator, 'standalone', {
    value: true,
    configurable: true,
  });
  try {
    setup();
    expect(screen.queryByText('Установить приложение')).not.toBeInTheDocument();
  } finally {
    Reflect.deleteProperty(navigator, 'standalone');
  }
});
