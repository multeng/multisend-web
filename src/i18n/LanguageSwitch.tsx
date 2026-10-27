import { useI18n } from './context';
import styles from './LanguageSwitch.module.css';

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <select
      className={styles.select}
      aria-label={t('Язык интерфейса')}
      value={locale}
      onChange={(event) => {
        const next = event.target.value;
        if (next === 'ru' || next === 'en') setLocale(next);
      }}
    >
      <option value="ru" lang="ru">
        Русский
      </option>
      <option value="en" lang="en">
        English
      </option>
    </select>
  );
}
