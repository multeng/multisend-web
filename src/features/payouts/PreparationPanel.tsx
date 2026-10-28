import { useContext, useEffect, useSyncExternalStore } from 'react';
import { Button } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import type {
  AuthenticatedSession,
  DraftRecipient,
  PreparationInput,
} from '../../api/generated';
import { ApiError } from '../../api/request';
import { useI18n } from '../../i18n/context';
import { AuthContext } from '../auth/context';
import type { AuthController } from '../auth/controller';
import { formatAmount, validateRecipients } from '../recipients/validation';
import { preparePayout } from './api';
import styles from './PreparationPanel.module.css';

export function PreparationPanel({
  recipients,
}: {
  recipients: DraftRecipient[];
}) {
  const controller = useContext(AuthContext);
  const { t } = useI18n();
  return controller ? (
    <ConnectedPreparation controller={controller} recipients={recipients} />
  ) : (
    <p>{t('Войдите через кошелёк для серверной проверки и плана частей.')}</p>
  );
}
function ConnectedPreparation({
  controller,
  recipients,
}: {
  controller: AuthController;
  recipients: DraftRecipient[];
}) {
  const { session, wallet } = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  const { t } = useI18n();
  if (!session?.authenticated)
    return (
      <p>{t('Войдите через кошелёк для серверной проверки и плана частей.')}</p>
    );
  if (
    !wallet ||
    wallet.address !== session.user.address.toLowerCase() ||
    wallet.network !== session.user.network ||
    wallet.network !== '-3' ||
    wallet.maxMessages === null
  )
    return (
      <p>
        {t(
          'Подключите тот же testnet-кошелёк с известным лимитом сообщений для плана частей.',
        )}
      </p>
    );
  const input: PreparationInput = {
    address: wallet.address,
    network: '-3',
    maxMessages: wallet.maxMessages,
    recipients,
  };
  return (
    <ReportPanel input={input} session={session} controller={controller} />
  );
}
function ReportPanel({
  input,
  session,
  controller,
}: {
  input: PreparationInput;
  session: AuthenticatedSession;
  controller: AuthController;
}) {
  const { t } = useI18n();
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- CSRF authenticates transport; session secrets must never enter cache keys.
  const query = useQuery({
    queryKey: [
      'private',
      session.user.id,
      session.user.address,
      session.user.network,
      'preparation',
      JSON.stringify(input),
    ],
    queryFn: ({ signal }) => preparePayout(input, session.csrfToken, signal),
    enabled: false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    gcTime: 0,
    networkMode: 'always',
  });
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401)
      void controller.logout();
  }, [query.error, controller]);
  const bounded =
    new TextEncoder().encode(JSON.stringify(input)).length <= 65536;
  return (
    <section className={styles.panel} aria-label={t('Серверная подготовка')}>
      <p>
        {t(
          'Список отправляется на сервер только по этой кнопке. Переводы не выполняются.',
        )}
      </p>
      <Button
        type="button"
        disabled={
          query.isFetching ||
          !bounded ||
          !validateRecipients(input.recipients).valid
        }
        onClick={() => void query.refetch()}
      >
        {query.isFetching
          ? t('Проверяем на сервере…')
          : t('Проверить на сервере и рассчитать части')}
      </Button>
      {!bounded && (
        <p role="alert">
          {t(
            'Список превышает лимит серверной проверки 64 КиБ. Уменьшите его размер.',
          )}
        </p>
      )}
      {query.isError && (
        <p role="alert">
          {t(
            'Не удалось получить план. Проверьте подключение кошелька и повторите проверку.',
          )}
        </p>
      )}
      {query.data && (
        <div role="status">
          <h4>{t('План частей по данным кошелька')}</h4>
          <p>{t('Комиссия сервиса: 0 TON')}</p>
          <p>
            {t(
              'Баланс и сетевые расходы ещё не проверены. Этот отчёт не разрешает отправку средств.',
            )}
          </p>
          {query.data.valid ? (
            <>
              <p>
                {t('Получателям:')}{' '}
                <strong>
                  {formatAmount(BigInt(query.data.totalNano))} TON
                </strong>
              </p>
              <p>
                {t('Частей / отдельных запросов подписи: {0}', {
                  0: query.data.parts.length,
                })}
              </p>
              <ol>
                {query.data.parts.map((part) => (
                  <li key={part.firstRecipient}>
                    {t('Строки {0}–{1}: {2} TON', {
                      0: part.firstRecipient + 1,
                      1: part.firstRecipient + part.recipientCount,
                      2: formatAmount(BigInt(part.totalNano)),
                    })}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p>
              {t(
                'Сервер отклонил список. Исправьте адреса, суммы и ограничения перед новой проверкой.',
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
