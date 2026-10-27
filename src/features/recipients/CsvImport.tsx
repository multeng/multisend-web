import { useI18n } from '../../i18n/context';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, TextArea } from '@radix-ui/themes';
import type { DraftRecipient } from '../../api/generated';
import { EditorDialog } from './EditorDialog';
import { MAX_CSV_BYTES, parseCSV, type Delimiter } from './csv';
import { formatAmount, validateRecipients } from './validation';
import styles from './Editor.module.css';

export function CsvImport({
  count,
  onApply,
  onClose,
}: {
  count: number;
  onApply: (rows: DraftRecipient[], replace: boolean) => void;
  onClose: () => void;
}) {
  const { t, message: localize } = useI18n();

  const [source, setSource] = useState('');
  const [delimiter, setDelimiter] = useState<Delimiter>(',');
  const [staged, setStaged] = useState<DraftRecipient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [reading, setReading] = useState(false);
  const generation = useRef(0);
  const id = useId();
  function reset() {
    generation.current++;
    setReading(false);
    setStaged(null);
    setConfirmed(false);
    setError(null);
  }
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  const validation = staged ? validateRecipients(staged) : null;
  return (
    <EditorDialog
      title={t('Импорт CSV')}
      onClose={() => {
        generation.current++;
        onClose();
      }}
    >
      <div className={styles.form}>
        <a href="/recipients-example.csv" download>
          {t('Скачать пример CSV')}
        </a>
        <p>
          {t('UTF-8, заголовок')} <code>address,amount,comment</code>
          {t(
            ', до 200 строк и 256 КиБ. Выберите разделитель явно. Данные разбираются в браузере.',
          )}
        </p>
        <label htmlFor={id + 'delimiter'}>{t('Разделитель')}</label>
        <select
          id={id + 'delimiter'}
          value={delimiter}
          onChange={(e) => {
            setDelimiter(e.target.value as Delimiter);
            reset();
          }}
        >
          <option value=",">{t('Запятая (,)')}</option>
          <option value=";">{t('Точка с запятой (;)')}</option>
          <option value={'\t'}>{t('Табуляция (TSV)')}</option>
        </select>
        <label htmlFor={id + 'file'}>{t('Файл CSV / TSV')}</label>
        <input
          id={id + 'file'}
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          onChange={async (event) => {
            reset();
            const file = event.target.files?.[0];
            if (!file) return;
            const current = generation.current;
            if (file.size > MAX_CSV_BYTES) {
              setError(t('CSV: максимум 256 КиБ.'));
              return;
            }
            setReading(true);
            try {
              const bytes = await file.arrayBuffer();
              const text = new TextDecoder('utf-8', { fatal: true }).decode(
                bytes,
              );
              if (current === generation.current) {
                setSource(text);
                setError(null);
              }
            } catch {
              if (current === generation.current)
                setError(t('Не удалось прочитать файл как UTF-8.'));
            } finally {
              if (current === generation.current) setReading(false);
            }
          }}
        />
        <label htmlFor={id + 'source'}>{t('Текст CSV')}</label>
        <TextArea
          id={id + 'source'}
          rows={5}
          value={source}
          onChange={(e) => {
            reset();
            setReading(false);
            setSource(e.target.value);
          }}
        />
        <Button
          disabled={reading || !source}
          onClick={() => {
            try {
              setStaged(parseCSV(source, delimiter));
              setError(null);
              setConfirmed(false);
            } catch (cause) {
              setStaged(null);
              setError(
                cause instanceof Error ? cause.message : t('Ошибка CSV.'),
              );
            }
          }}
        >
          {t('Проверить импорт')}
        </Button>
        {error && <p role="alert">{localize(error)}</p>}
        {staged && (
          <div className={styles.importPreview}>
            <h3>
              {t('Будет импортировано:')} {staged.length}
            </h3>
            <p>
              {t('Корректные суммы:')} {formatAmount(validation!.total)}{' '}
              {t(
                'TON. Ошибки полей можно исправить после импорта; отправка недоступна.',
              )}
            </p>
            <ol>
              {staged.slice(0, 3).map((row, index) => (
                <li key={index}>
                  <code>{row.address}</code> — {row.amount} TON
                  {validation!.rows[index]!.errors.length > 0
                    ? t(' · требует исправления')
                    : ''}
                </li>
              ))}
            </ol>
            {staged.length > 3 && (
              <p>{t('Дополнительных строк: {0}', { 0: staged.length - 3 })}</p>
            )}
            <Button
              disabled={staged.length + count > 200}
              onClick={() => onApply(staged, false)}
            >
              {t('Добавить к списку')}
            </Button>
            {staged.length + count > 200 && (
              <p role="alert">
                {t(
                  'Вместе получится больше 200 получателей. Выберите замену или сократите список.',
                )}
              </p>
            )}
            {count > 0 && (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                {t('Подтверждаю замену текущего списка')}
              </label>
            )}
            <Button
              variant="outline"
              disabled={count > 0 && !confirmed}
              onClick={() => onApply(staged, true)}
            >
              {t('Заменить список')}
            </Button>
          </div>
        )}
      </div>
    </EditorDialog>
  );
}
