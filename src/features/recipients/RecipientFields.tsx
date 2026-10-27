import { useI18n } from '../../i18n/context';
import { useId, useState } from 'react';
import { Button, TextArea, TextField } from '@radix-ui/themes';
import type { DraftRecipient } from '../../api/generated';
import { EditorDialog } from './EditorDialog';
import { textLength } from './validation';
import styles from './Editor.module.css';

export function RecipientFields({
  initial,
  onApply,
  onClose,
  isNew,
}: {
  initial: DraftRecipient;
  onApply: (row: DraftRecipient) => void;
  onClose: () => void;
  isNew: boolean;
}) {
  const { t } = useI18n();

  const [row, setRow] = useState(initial);
  const id = useId();
  const bounded =
    textLength(row.address) <= 128 &&
    textLength(row.amount) <= 128 &&
    textLength(row.comment) <= 500;
  return (
    <EditorDialog
      title={isNew ? t('Новый получатель') : t('Подробности получателя')}
      onClose={onClose}
    >
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          if (bounded) onApply(row);
        }}
      >
        <label htmlFor={id + 'address'}>{t('Адрес получателя')}</label>
        <TextField.Root
          id={id + 'address'}
          value={row.address}
          onChange={(e) => setRow({ ...row, address: e.target.value })}
          autoComplete="off"
          spellCheck={false}
        />
        <label htmlFor={id + 'amount'}>{t('Сумма, TON')}</label>
        <TextField.Root
          id={id + 'amount'}
          value={row.amount}
          onChange={(e) => setRow({ ...row, amount: e.target.value })}
          inputMode="decimal"
          autoComplete="off"
        />
        <label htmlFor={id + 'comment'}>{t('Комментарий')}</label>
        <TextArea
          id={id + 'comment'}
          value={row.comment}
          onChange={(e) => setRow({ ...row, comment: e.target.value })}
        />
        <p className={styles.muted}>
          {t(
            'Адрес и сумма — до 128 символов, комментарий — до 500. Незавершённые поля можно сохранить в черновике.',
          )}
        </p>
        {!bounded && (
          <p role="alert">
            {t(
              'Превышен лимит поля. Сократите текст, он не будет обрезан автоматически.',
            )}
          </p>
        )}
        <Button type="submit" disabled={!bounded}>
          {isNew ? t('Добавить') : t('Применить изменения')}
        </Button>
      </form>
    </EditorDialog>
  );
}
