import { useI18n } from '../../i18n/context';
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthController, type Connector } from './controller';
import { AuthContext } from './context';
import { siteManifest } from './manifest';

const manifest = siteManifest(import.meta.env.VITE_PUBLIC_SITE_URL ?? '');
const WalletBridge = lazy(() => import('./WalletBridge'));

function SessionProvider({
  connector,
  children,
}: {
  connector: Connector | null;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [controller] = useState(
    () =>
      new AuthController(connector, () => {
        void queryClient.cancelQueries({ queryKey: ['private'] });
        queryClient.removeQueries({ queryKey: ['private'] });
      }),
  );
  useEffect(() => {
    void controller.start();
    let wasHidden = document.visibilityState === 'hidden';
    const resume = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true;
        return;
      }
      if (wasHidden) {
        wasHidden = false;
        void controller.revalidate();
      }
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      controller.stop();
    };
  }, [controller]);
  return <AuthContext value={controller}>{children}</AuthContext>;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return manifest ? (
    <Suspense
      fallback={
        <p role="status">{t('Подготавливаем подключение кошелька…')}</p>
      }
    >
      <WalletBridge manifestUrl={`${manifest.url}/tonconnect-manifest.json`}>
        {(connector) => (
          <SessionProvider connector={connector}>{children}</SessionProvider>
        )}
      </WalletBridge>
    </Suspense>
  ) : (
    <SessionProvider connector={null}>{children}</SessionProvider>
  );
}
