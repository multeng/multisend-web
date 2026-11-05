import { useEffect, useRef, useState } from 'react';
import { Button } from '@radix-ui/themes';
import { useI18n } from '../../i18n/context';
import styles from './InstallApp.module.css';

type InstallPrompt = Event & { prompt(): Promise<unknown> };
function standalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallApp() {
  const { t } = useI18n();
  const [installed, setInstalled] = useState(standalone);
  const [available, setAvailable] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<InstallPrompt | null>(null);
  useEffect(() => {
    const media = window.matchMedia?.('(display-mode: standalone)');
    const receive = (event: Event) => {
      if (
        standalone() ||
        !('prompt' in event) ||
        typeof event.prompt !== 'function'
      )
        return;
      event.preventDefault();
      pending.current = event as InstallPrompt;
      setAvailable(true);
      setFailed(false);
    };
    const done = () => {
      pending.current = null;
      setAvailable(false);
      setInstalled(true);
    };
    const changed = () => {
      if (standalone()) done();
    };
    window.addEventListener('beforeinstallprompt', receive);
    window.addEventListener('appinstalled', done);
    media?.addEventListener('change', changed);
    return () => {
      pending.current = null;
      window.removeEventListener('beforeinstallprompt', receive);
      window.removeEventListener('appinstalled', done);
      media?.removeEventListener('change', changed);
    };
  }, []);
  async function install() {
    const event = pending.current;
    if (!event) return;
    pending.current = null;
    setAvailable(false);
    try {
      await event.prompt();
    } catch {
      setFailed(true);
    }
  }
  if (installed) return null;
  return (
    <details className={styles.panel}>
      <summary>{t('Установить приложение')}</summary>
      <p>
        {t(
          'Добавьте TON Multisend на главный экран и открывайте его в отдельном окне.',
        )}
      </p>
      {available && (
        <Button type="button" onClick={() => void install()}>
          {t('Установить')}
        </Button>
      )}
      {failed && (
        <p role="alert">{t('Используйте меню браузера для установки.')}</p>
      )}
      <p>
        {t(
          'Android: откройте меню браузера → «Установить приложение» или «Добавить на главный экран». Название пункта зависит от браузера.',
        )}
      </p>
      <p>
        {t(
          'iPhone/iPad: в Safari откройте «Поделиться» → На экран «Домой». Если доступно, включите «Открывать как веб-приложение».',
        )}
      </p>
      <p>
        {t(
          'Если такого пункта нет, откройте сайт в Chrome на Android или Safari на iPhone. Для входа и серверных операций нужно подключение к интернету.',
        )}
      </p>
    </details>
  );
}
