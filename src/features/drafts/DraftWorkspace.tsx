import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Button, TextField } from '@radix-ui/themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthenticatedSession, DraftDetail } from '../../api/generated';
import { ApiError } from '../../api/request';
import { useAuthController } from '../auth/context';
import { draftKeys, draftsApi } from './api';
import styles from './DraftWorkspace.module.css';

export function DraftWorkspace() {
  const controller = useAuthController();
  const { session } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  return session?.authenticated ? (
    <OwnedWorkspace
      key={`${session.user.id}:${session.user.address}:${session.user.network}`}
      session={session}
    />
  ) : null;
}
function OwnedWorkspace({ session }: { session: AuthenticatedSession }) {
  const controller = useAuthController();
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const operations = useRef(new AbortController());
  const id = useId();
  useEffect(() => {
    operations.current = new AbortController();
    return () => operations.current.abort();
  }, []);
  const list = useQuery({
    queryKey: draftKeys.list(session.user),
    queryFn: ({ signal }) => draftsApi.list(signal),
    networkMode: 'always',
    gcTime: 0,
  });
  const detail = useQuery({
    queryKey: draftKeys.detail(session.user, selected ?? ''),
    queryFn: ({ signal }) => draftsApi.get(selected!, signal),
    enabled: selected !== null,
    networkMode: 'always',
    gcTime: 0,
    staleTime: 10_000,
  });
  const queryError = list.error ?? detail.error;
  useEffect(() => {
    if (queryError instanceof ApiError && queryError.status === 401)
      void controller.logout();
  }, [queryError, controller]);
  async function run(action: (signal: AbortSignal) => Promise<void>) {
    if (pending) return;
    const signal = operations.current.signal;
    setPending(true);
    setError(null);
    setConflict(false);
    try {
      await action(signal);
    } catch (cause) {
      if (signal.aborted) return;
      if (cause instanceof ApiError && cause.status === 401) {
        void controller.logout();
        return;
      }
      const stale = cause instanceof ApiError && cause.code === 'conflict';
      setConflict(stale);
      setError(
        stale
          ? 'Черновик уже изменён в другой вкладке. Ваш текст сохранён в форме.'
          : cause instanceof ApiError && cause.code === 'quota_exceeded'
            ? 'Достигнут лимит 100 черновиков. Удалите ненужные.'
            : 'Не удалось подтвердить изменение. Обновите список перед повтором.',
      );
    } finally {
      if (!signal.aborted) setPending(false);
    }
  }
  function saved(draft: DraftDetail, signal: AbortSignal) {
    signal.throwIfAborted();
    client.setQueryData(draftKeys.detail(session.user, draft.id), draft);
    void client.invalidateQueries({
      queryKey: draftKeys.list(session.user),
      exact: true,
    });
    setSelected(draft.id);
  }
  return (
    <section className={styles.workspace} aria-labelledby="drafts-title">
      <div className={styles.heading}>
        <div>
          <h2 id="drafts-title">Личные черновики</h2>
          <p>Сохраняются для вашего кошелька в testnet.</p>
        </div>
        <Button
          variant="soft"
          disabled={pending || list.isFetching}
          onClick={() => void list.refetch()}
        >
          Обновить список
        </Button>
      </div>
      <form
        className={styles.create}
        onSubmit={(event) => {
          event.preventDefault();
          void run(async (signal) => {
            const draft = await draftsApi.create(
              { name: name.trim(), recipients: [] },
              session.csrfToken,
              signal,
            );
            saved(draft, signal);
            setName('');
          });
        }}
      >
        <label htmlFor={id}>Название нового черновика</label>
        <TextField.Root
          id={id}
          value={name}
          maxLength={120}
          required
          disabled={pending}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, выплаты команде"
        />
        <Button type="submit" disabled={pending || !name.trim()}>
          Создать черновик
        </Button>
      </form>
      {list.isPending && <p role="status">Загружаем черновики…</p>}
      {list.isError && (
        <p role="alert">
          Не удалось загрузить список. Попробуйте обновить его.
        </p>
      )}
      {list.data?.items.length === 0 && (
        <p>Пока нет черновиков. Создайте первый список.</p>
      )}
      <ul className={styles.list}>
        {list.data?.items.map((draft) => (
          <li key={draft.id}>
            <span className={styles.draftName}>{draft.name}</span>
            <Button
              variant="outline"
              aria-label={`Открыть ${draft.name}`}
              disabled={pending}
              onClick={() => {
                setSelected(draft.id);
                setError(null);
                setConflict(false);
              }}
            >
              Открыть
            </Button>
          </li>
        ))}
      </ul>
      {selected && detail.isPending && <p role="status">Открываем черновик…</p>}
      {selected && detail.isError && (
        <div role="alert">
          <p>Не удалось открыть черновик. Возможно, он удалён.</p>
          <Button onClick={() => void detail.refetch()}>
            Повторить открытие
          </Button>
        </div>
      )}
      {selected && detail.data && (
        <DraftEditor
          key={`${detail.data.id}:${detail.data.version}:${epoch}`}
          draft={detail.data}
          pending={pending}
          onSave={(name) =>
            void run(async (signal) => {
              const d = await draftsApi.update(
                detail.data.id,
                {
                  version: detail.data.version,
                  name,
                  recipients: detail.data.recipients,
                },
                session.csrfToken,
                signal,
              );
              saved(d, signal);
            })
          }
          onDelete={() =>
            void run(async (signal) => {
              const d = detail.data;
              await draftsApi.remove(
                d.id,
                d.version,
                session.csrfToken,
                signal,
              );
              signal.throwIfAborted();
              setSelected(null);
              client.removeQueries({
                queryKey: draftKeys.detail(session.user, d.id),
                exact: true,
              });
              void client.invalidateQueries({
                queryKey: draftKeys.list(session.user),
                exact: true,
              });
            })
          }
        />
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          {conflict && (
            <Button
              variant="soft"
              disabled={pending}
              onClick={() =>
                void run(async (signal) => {
                  const result = await detail.refetch();
                  signal.throwIfAborted();
                  if (result.error) throw result.error;
                  setEpoch((v) => v + 1);
                })
              }
            >
              Загрузить последнюю версию
            </Button>
          )}
        </div>
      )}
      <p className={styles.note}>
        Это сохранение черновика. Редактор получателей и импорт CSV появятся на
        следующем этапе; отправка средств пока недоступна.
      </p>
    </section>
  );
}
function DraftEditor({
  draft,
  pending,
  onSave,
  onDelete,
}: {
  draft: DraftDetail;
  pending: boolean;
  onSave: (name: string) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(draft.name);
  const [confirm, setConfirm] = useState(false);
  const id = useId();
  return (
    <div className={styles.editor}>
      <h3>Черновик · версия {draft.version}</h3>
      <p>Получателей: {draft.recipients.length}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name.trim());
        }}
      >
        <label htmlFor={id}>Название черновика</label>
        <TextField.Root
          id={id}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
          disabled={pending}
        />
        <div className={styles.actions}>
          <Button type="submit" disabled={pending || !name.trim()}>
            Сохранить название
          </Button>
          <Button
            type="button"
            variant="soft"
            color="red"
            disabled={pending}
            onClick={() => setConfirm(true)}
          >
            Удалить черновик
          </Button>
        </div>
      </form>
      {confirm && (
        <div className={styles.confirm}>
          <p>Удалить этот черновик без возможности восстановления?</p>
          <div className={styles.actions}>
            <Button color="red" disabled={pending} onClick={onDelete}>
              Удалить окончательно
            </Button>
            <Button
              variant="soft"
              disabled={pending}
              onClick={() => setConfirm(false)}
            >
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
