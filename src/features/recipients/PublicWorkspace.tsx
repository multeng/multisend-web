import { useI18n } from '../../i18n/context';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button, TextField } from '@radix-ui/themes';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthenticatedSession, DraftRecipient } from '../../api/generated';
import { ApiError } from '../../api/request';
import { useAuthController } from '../auth/context';
import { draftKeys, draftsApi } from '../drafts/api';
import { draftInputError } from '../drafts/input';
import { EditorDialog } from './EditorDialog';
import { RecipientEditor } from './RecipientEditor';
import styles from './Editor.module.css';
import workspaceStyles from '../drafts/DraftWorkspace.module.css';

export function PublicWorkspace() {
  const { t } = useI18n();

  const controller = useAuthController();
  const { session } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const [rows, setRows] = useState<DraftRecipient[]>([]);
  const [example, setExample] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!rows.length) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [rows.length]);
  function demo() {
    setRows([
      {
        address: '0:' + '0'.repeat(64),
        amount: '0.1',
        comment: t('Демонстрационный получатель'),
      },
      {
        address: '0:' + '1'.repeat(64),
        amount: '0.000000001',
        comment: t('Синтетический пример'),
      },
    ]);
    setExample(true);
    setEpoch((v) => v + 1);
    setConfirm(false);
  }
  return (
    <section
      className={workspaceStyles.workspace}
      aria-labelledby="prepare-title"
    >
      <h2 id="prepare-title">{t('Подготовить список выплат')}</h2>
      <p>
        {t(
          'Список хранится только в памяти этой вкладки. Чтобы не потерять его при обновлении, экспортируйте CSV или явно сохраните личный черновик после входа.',
        )}
      </p>
      <Button
        variant="soft"
        disabled={saving}
        onClick={() => {
          if (rows.length) setConfirm(true);
          else demo();
        }}
      >
        {t('Попробовать на примере')}
      </Button>
      {example && (
        <p role="status">
          {t(
            'Демонстрация: синтетические адреса, средства не отправляются. Замените их своими получателями.',
          )}
        </p>
      )}
      <RecipientEditor
        key={epoch}
        value={rows}
        onChange={setRows}
        disabled={saving}
      />
      {session?.authenticated ? (
        <SavePrepared
          key={session.user.id + session.user.address + session.user.network}
          session={session}
          rows={rows}
          onPending={setSaving}
        />
      ) : (
        <p>
          {t(
            'Для сохранения на сервере войдите кошельком. До явного сохранения получатели на сервер не отправляются.',
          )}
        </p>
      )}
      {confirm && (
        <EditorDialog
          title={t('Заменить список примером?')}
          onClose={() => setConfirm(false)}
        >
          <p>
            {t(
              'Текущие строки будут заменены. Можно закрыть окно и сначала экспортировать CSV.',
            )}
          </p>
          <Button onClick={demo}>{t('Заменить примером')}</Button>
        </EditorDialog>
      )}
    </section>
  );
}
function SavePrepared({
  session,
  rows,
  onPending,
}: {
  session: AuthenticatedSession;
  rows: DraftRecipient[];
  onPending: (pending: boolean) => void;
}) {
  const { t, message: localize } = useI18n();

  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState<string | null>(null);
  const [savedInput, setSavedInput] = useState<string | null>(null);
  const controller = useAuthController();
  const client = useQueryClient();
  const request = useRef(new AbortController());
  useEffect(() => {
    request.current = new AbortController();
    return () => {
      request.current.abort();
      onPending(false);
    };
  }, [onPending]);
  const error = draftInputError({ name: name.trim(), recipients: rows });
  const currentInput = JSON.stringify({ name: name.trim(), recipients: rows });
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending || error || !rows.length || savedInput === currentInput)
          return;
        const signal = request.current.signal;
        setPending(true);
        onPending(true);
        setMessageInput(currentInput);
        setMessage(null);
        void draftsApi
          .create(
            { name: name.trim(), recipients: rows },
            session.csrfToken,
            signal,
          )
          .then(() => {
            signal.throwIfAborted();
            setSavedInput(currentInput);
            setMessage(
              t(
                'Личный черновик сохранён. Откройте его в разделе «Личные черновики».',
              ),
            );
            void client.invalidateQueries({
              queryKey: draftKeys.list(session.user),
              exact: true,
            });
          })
          .catch((cause) => {
            if (signal.aborted) return;
            if (cause instanceof ApiError && cause.status === 401) {
              void controller.logout();
              return;
            }
            setMessage(
              t(
                'Сохранение не подтверждено. Обновите личные черновики перед повтором, чтобы не создать копию.',
              ),
            );
          })
          .finally(() => {
            if (!signal.aborted) {
              setPending(false);
              onPending(false);
            }
          });
      }}
    >
      <label htmlFor="prepared-name">
        {t('Название для сохранения списка')}
      </label>
      <TextField.Root
        id="prepared-name"
        value={name}
        maxLength={120}
        disabled={pending}
        onChange={(e) => {
          setName(e.target.value);
          setMessage(null);
        }}
      />
      {name && error && <p role="alert">{localize(error)}</p>}
      <Button
        type="submit"
        disabled={
          pending ||
          Boolean(error) ||
          !rows.length ||
          savedInput === currentInput
        }
      >
        {pending ? t('Сохраняем…') : t('Сохранить список в личные черновики')}
      </Button>
      {message && messageInput === currentInput && (
        <p role="status">{localize(message)}</p>
      )}
    </form>
  );
}
