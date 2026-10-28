import { useI18n } from '../../i18n/context';
import { useId, useState } from 'react';
import { Badge, Button, TextField } from '@radix-ui/themes';
import type { DraftRecipient } from '../../api/generated';
import { CsvImport } from './CsvImport';
import { downloadCSV } from './csv';
import { EditorDialog } from './EditorDialog';
import { RecipientFields } from './RecipientFields';
import { formatAmount, validateRecipients } from './validation';
import styles from './Editor.module.css';
import { PreparationPanel } from '../payouts/PreparationPanel';

const empty: DraftRecipient = { address: '', amount: '', comment: '' };
export function RecipientEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: DraftRecipient[];
  onChange: (rows: DraftRecipient[]) => void;
  disabled?: boolean;
}) {
  const { t, message: localize } = useI18n();

  const [ids, setIds] = useState(() => value.map(() => crypto.randomUUID()));
  const [editing, setEditing] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState(false);
  const [ack, setAck] = useState(false);
  const [exported, setExported] = useState(false);
  const id = useId();
  const validation = validateRecipients(value);
  const duplicates = validation.rows.some((row) => row.duplicate);
  function change(rows: DraftRecipient[], keys = ids) {
    if (disabled) return;
    setIds(rows.map((_, index) => keys[index] ?? crypto.randomUUID()));
    setAck(false);
    setPreview(false);
    setExported(false);
    onChange(rows);
  }
  return (
    <div className={styles.editor} data-recipient-editor>
      <div className={styles.toolbar}>
        <Badge size="2">TON · Testnet</Badge>
        <span>
          {value.length} {t('/ 200 получателей')}
        </span>
        <Button
          data-editor-add
          disabled={disabled || value.length >= 200}
          onClick={() => setEditing(value.length)}
        >
          {t('Добавить получателя')}
        </Button>
        <Button
          variant="soft"
          disabled={disabled}
          onClick={() => setImporting(true)}
        >
          {t('Импорт CSV / вставить')}
        </Button>
        <Button
          variant="outline"
          disabled={!value.length}
          onClick={() => {
            downloadCSV(value);
            setExported(true);
          }}
        >
          {t('Экспорт CSV')}
        </Button>
      </div>
      {exported && (
        <p role="status">
          {t(
            'CSV подготовлен. Для защиты таблиц поля, начинающиеся с = + - @ или управляющих символов, получают апостроф.',
          )}
        </p>
      )}
      {!value.length && (
        <p className={styles.empty}>
          {t(
            'Начните с одного получателя или вставьте готовый CSV. Подключать кошелёк для проверки списка не нужно.',
          )}
        </p>
      )}
      <ol className={styles.rows}>
        {value.map((row, index) => (
          <li key={ids[index]} className={styles.row}>
            <div className={styles.address}>
              <span className={styles.rowLabel}>
                {t('Получатель')} {index + 1}
              </span>
              <code>{row.address || t('Адрес пока не указан')}</code>
              <span className={styles.muted}>
                {row.comment || t('Без комментария')}
              </span>
            </div>
            <div>
              <label htmlFor={id + ids[index]}>
                {t('Сумма получателя')} {index + 1}, TON
              </label>
              <TextField.Root
                id={id + ids[index]}
                inputMode="decimal"
                value={row.amount}
                disabled={disabled}
                aria-invalid={validation.rows[index]!.errors.length > 0}
                aria-describedby={id + 'issues' + ids[index]}
                onChange={(e) =>
                  change(
                    value.map((r, i) =>
                      i === index ? { ...r, amount: e.target.value } : r,
                    ),
                  )
                }
              />
            </div>
            <div className={styles.actions}>
              <Button
                variant="soft"
                disabled={disabled}
                aria-label={t('Изменить получателя {0}', { 0: index + 1 })}
                onClick={() => setEditing(index)}
              >
                {t('Подробности')}
              </Button>
              <Button
                variant="ghost"
                color="red"
                disabled={disabled}
                aria-label={t('Удалить получателя {0}', { 0: index + 1 })}
                onClick={() => setRemoving(index)}
              >
                {t('Удалить')}
              </Button>
            </div>
            <div id={id + 'issues' + ids[index]} className={styles.issues}>
              {validation.rows[index]!.errors.map((error) => (
                <p className={styles.error} key={error}>
                  {localize(error)}
                </p>
              ))}
              {validation.rows[index]!.warnings.map((warning) => (
                <p className={styles.warning} key={warning}>
                  {localize(warning)}
                </p>
              ))}
              {validation.rows[index]!.duplicate && (
                <p className={styles.warning}>
                  {t(
                    'Повтор адреса: отдельная строка выплаты. Проверьте назначение.',
                  )}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {duplicates && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={ack}
            disabled={disabled}
            onChange={(e) => {
              setAck(e.target.checked);
              setPreview(false);
            }}
          />
          {t('Оставить повторяющиеся адреса отдельными выплатами')}
        </label>
      )}
      <div className={styles.summary}>
        <p>
          {t('Итого по корректным суммам:')}{' '}
          <strong>{formatAmount(validation.total)} TON</strong>
        </p>
        {validation.errors.map((error) => (
          <p key={error}>{localize(error)}</p>
        ))}
        <Button
          disabled={disabled || !validation.valid || (duplicates && !ack)}
          onClick={() => setPreview(true)}
        >
          {t('Проверить список')}
        </Button>
      </div>
      {preview && (
        <section
          aria-label={t('Предпросмотр списка')}
          className={styles.preview}
        >
          <h3>{t('Предпросмотр · Testnet')}</h3>
          <PreparationPanel recipients={value} />
          <p>
            {t('Получателям:')}{' '}
            <strong>{formatAmount(validation.total)} TON</strong>
          </p>
          <ol>
            {value.map((row, index) => (
              <li key={ids[index]}>
                <code>{row.address}</code>
                <p>{row.amount} TON</p>
                {row.comment && <p>{row.comment}</p>}
              </li>
            ))}
          </ol>
          <p>
            {t(
              'Комиссия сервиса в testnet — 0 TON. Сетевые расходы и баланс ещё не проверены. Отправка средств недоступна.',
            )}
          </p>
          <p>
            {t(
              'Проверка формата не подтверждает владельца адреса или состояние кошелька получателя.',
            )}
          </p>
        </section>
      )}
      {editing !== null && (
        <RecipientFields
          key={editing}
          initial={value[editing] ?? empty}
          isNew={editing === value.length}
          onClose={() => setEditing(null)}
          onApply={(row) => {
            change(
              editing === value.length
                ? [...value, row]
                : value.map((r, i) => (i === editing ? row : r)),
            );
            setEditing(null);
          }}
        />
      )}
      {removing !== null && (
        <EditorDialog
          title={t('Удалить получателя?')}
          onClose={() => setRemoving(null)}
        >
          <p>
            {t('Строка')} {removing + 1}{' '}
            {t('будет удалена из текущего списка.')}
          </p>
          <Button
            color="red"
            onClick={() => {
              change(
                value.filter((_, i) => i !== removing),
                ids.filter((_, i) => i !== removing),
              );
              setRemoving(null);
            }}
          >
            {t('Удалить')}
          </Button>
        </EditorDialog>
      )}
      {importing && (
        <CsvImport
          count={value.length}
          onClose={() => setImporting(false)}
          onApply={(rows, replace) => {
            change(replace ? rows : [...value, ...rows], replace ? [] : ids);
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
