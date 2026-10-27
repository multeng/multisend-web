import { useI18n } from '../../i18n/context';
import { useSyncExternalStore } from 'react';
import { Button } from '@radix-ui/themes';
import { useAuthController } from './context';
import styles from './AuthPanel.module.css';

export function AuthPanel() {
  const { t, message: localize } = useI18n();

  const controller = useAuthController();
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const configured = Boolean(import.meta.env.VITE_PUBLIC_SITE_URL);
  const busy = ['loading', 'preparing', 'verifying'].includes(state.phase);
  return (
    <section
      className={styles.panel}
      aria-labelledby="auth-title"
      aria-busy={busy}
    >
      <div>
        <h2 id="auth-title">{t('Ваш кошелёк · Testnet')}</h2>
        <p>
          {t(
            'Вход открывает личные черновики. Подпись входа не отправляет средства.',
          )}
        </p>
      </div>
      {state.session?.authenticated ? (
        <>
          <p className={styles.address}>
            {t('Вы вошли:')} {state.session.user.address}
          </p>
          <Button
            variant="soft"
            disabled={busy}
            onClick={() => void controller.logout()}
          >
            {t('Выйти')}
          </Button>
        </>
      ) : (
        <Button
          disabled={!configured || busy || state.phase === 'waiting'}
          onClick={() => void controller.login()}
        >
          {state.phase === 'waiting'
            ? t('Подтвердите вход в кошельке')
            : state.phase === 'verifying'
              ? t('Проверяем подпись…')
              : t('Войти через кошелёк')}
        </Button>
      )}
      {state.phase === 'waiting' && (
        <Button variant="soft" onClick={() => void controller.logout()}>
          {t('Отменить вход')}
        </Button>
      )}
      {!configured && (
        <p>
          {t('Вход станет доступен после настройки HTTPS-адреса приложения.')}
        </p>
      )}
      {state.error && (
        <div role="alert">
          <p>{localize(state.error)}</p>
          <Button
            variant="soft"
            disabled={busy}
            onClick={() => void controller.logout()}
          >
            {t('Сбросить сессию')}
          </Button>
        </div>
      )}
    </section>
  );
}
