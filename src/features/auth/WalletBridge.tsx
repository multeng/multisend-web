import type { ReactNode } from 'react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import type { Connector } from './controller';

function Connected({
  children,
}: {
  children: (connector: Connector) => ReactNode;
}) {
  const [ui] = useTonConnectUI();
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
