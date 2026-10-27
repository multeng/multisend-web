import { useEffect, type ReactNode } from 'react';
import { useI18n } from '../../i18n/context';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import type { Connector } from './controller';

function Connected({
  children,
}: {
  children: (connector: Connector) => ReactNode;
}) {
  const [ui, setOptions] = useTonConnectUI();
  const { locale } = useI18n();
  useEffect(() => {
    setOptions({ language: locale });
  }, [locale, setOptions]);
  return children(ui);
}
export default function WalletBridge({
  manifestUrl,
  children,
}: {
  manifestUrl: string;
  children: (connector: Connector) => ReactNode;
}) {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl} analytics={{ mode: 'off' }}>
      <Connected>{children}</Connected>
    </TonConnectUIProvider>
  );
}
