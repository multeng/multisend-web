import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '../../i18n/I18nProvider';
import { LanguageSwitch } from '../../i18n/LanguageSwitch';
import WalletBridge from './WalletBridge';

const { setOptions, ui } = vi.hoisted(() => ({
  setOptions: vi.fn(),
  ui: { id: 'existing-connector' },
}));
vi.mock('@tonconnect/ui-react', () => ({
  TonConnectUIProvider: ({ children }: { children: ReactNode }) => children,
  useTonConnectUI: () => [ui, setOptions],
}));
it('changes TON Connect labels through options while retaining its connector', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('ru');
  const connector = vi.fn().mockReturnValue(<p>Wallet UI</p>);
  render(
    <I18nProvider>
      <LanguageSwitch />
      <WalletBridge manifestUrl="https://example.com/tonconnect-manifest.json">
        {connector}
      </WalletBridge>
    </I18nProvider>,
  );
  expect(setOptions).toHaveBeenLastCalledWith({ language: 'ru' });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });
  expect(setOptions).toHaveBeenLastCalledWith({ language: 'en' });
  expect(connector.mock.calls.every(([value]) => value === ui)).toBe(true);
});
