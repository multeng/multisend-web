import { useEffect, useId, useState } from 'react';
import { Button } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import type {
  AuthenticatedSession,
  PreparationInput,
} from '../../api/generated';
import { ApiError } from '../../api/request';
import { useI18n } from '../../i18n/context';
import type { AuthController } from '../auth/controller';
import { formatAmount } from '../recipients/validation';
import { quotePayout, type QuoteResult } from './quote';
import styles from './QuotePanel.module.css';

type Props = {
  input: PreparationInput;
  session: AuthenticatedSession;
  controller: AuthController;
};
export function QuotePanel({ input, session, controller }: Props) {
  const { t } = useI18n();
  const [bounce, setBounce] = useState(false);
  const bounceDescription = useId();
  if (input.maxMessages > 4 || input.maxMessages < 1)
    return (
      <section className={styles.panel} aria-label={t('Оценка расходов')}>
        <h4>{t('Оценка расходов')}</h4>
        <p>
          {t(
            'Кошелёк сообщает лимит {0} сообщений. Сейчас расчёт поддерживает лимит от 1 до 4. Проверка списка и черновики остаются доступны.',
            { 0: input.maxMessages },
          )}
        </p>
      </section>
    );
  const request = { ...input, bounce: input.recipients.map(() => bounce) };
  return (
    <section className={styles.panel} aria-label={t('Оценка расходов')}>
      <h4>{t('Оценка расходов')}</h4>
      <p>
        {t(
          'По кнопке список и настройки отправятся на сервер для расчёта. Только активный V4R2; переводы не выполняются.',
        )}
      </p>
      <label className={styles.bounce}>
        <input
          type="checkbox"
          checked={bounce}
          aria-describedby={bounceDescription}
          onChange={(e) => setBounce(e.target.checked)}
        />
        {t('Возвращать перевод при ошибке получателя (bounce)')}
      </label>
      <p id={bounceDescription}>
        {t(
          'Возврат не гарантирован; сетевые расходы возможны. Bounce не отменяет перевод на неверный адрес. При выключенном bounce перевод может пополнить неактивный адрес. Настройка применяется ко всем строкам оценки.',
        )}
      </p>
      <QuoteRequest
        key={JSON.stringify([session.user, request])}
        input={request}
        session={session}
        controller={controller}
      />
    </section>
  );
}

function QuoteRequest({
  input,
  session,
  controller,
}: Props & { input: PreparationInput & { bounce: boolean[] } }) {
  const { t } = useI18n();
  // gcTime=0 still schedules asynchronous removal. A new preview must never
  // revive a completed estimate when input changes back before that timer runs.
  const previewId = useId();
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- CSRF authenticates transport; never put session secrets in cache keys.
  const query = useQuery({
    queryKey: [
      'private',
      session.user.id,
      session.user.address,
      session.user.network,
      'fee-quote',
      previewId,
      JSON.stringify(input),
    ],
    queryFn: ({ signal }) => quotePayout(input, session.csrfToken, signal),
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
    <>
      <Button
        type="button"
        disabled={query.isFetching || !bounded}
        onClick={() => void query.refetch()}
      >
        {query.isFetching
          ? t('Рассчитываем расходы…')
          : t('Рассчитать расходы')}
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
          {query.error instanceof ApiError &&
          query.error.code === 'unsupported_wallet'
            ? t(
                'Расчёт недоступен: состояние или версия контракта не поддерживается. Нужен активный (ACTIVE) контракт V4R2 и лимит 1–4 сообщения. Состояние можно посмотреть через «Проверить баланс»; наличие TON само по себе не подтверждает поддержку.',
              )
            : query.error instanceof ApiError &&
                query.error.code === 'quote_busy'
              ? t(
                  'Расчёт занят. Запросите оценку повторно через несколько секунд.',
                )
              : query.error instanceof ApiError &&
                  query.error.code === 'insufficient_balance'
                ? t(
                    'Баланс не покрывает сумму переводов. Оценка сетевых расходов не получена.',
                  )
                : query.error instanceof ApiError &&
                    query.error.code === 'simulation_incomplete'
                  ? t(
                      'Не удалось смоделировать все переводы. Полная оценка расходов недоступна.',
                    )
                  : t(
                      'Не удалось рассчитать расходы. Проверьте кошелёк и повторите запрос позднее.',
                    )}
        </p>
      )}
      {query.data && !query.isFetching && !query.isError && (
        <QuoteView key={query.data.validUntil} result={query.data} />
      )}
    </>
  );
}

function QuoteView({ result }: { result: QuoteResult }) {
  const { t, locale } = useI18n();
  const [expired, setExpired] = useState(
    () => performance.now() >= result.validUntil,
  );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(timer);
      const remaining = result.validUntil - performance.now();
      if (remaining <= 0) setExpired(true);
      else timer = setTimeout(check, Math.max(1, Math.ceil(remaining)));
    };
    timer = setTimeout(
      check,
      Math.max(1, Math.ceil(result.validUntil - performance.now())),
    );
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [result.validUntil]);
  if (expired)
    return (
      <p role="status">{t('Оценка устарела. Рассчитайте расходы заново.')}</p>
    );
  const { report } = result;
  const amount = (value: string) => `${formatAmount(BigInt(value))} TON`;
  return (
    <div role="status">
      <dl className={styles.costs}>
        <dt>{t('Получателям:')}</dt>
        <dd>{amount(report.transferTotalNano)}</dd>
        <dt>{t('Комиссия сервиса')}</dt>
        <dd>{amount(report.serviceFeeNano)}</dd>
        <dt>{t('Оценка сетевых расходов')}</dt>
        <dd>{amount(report.estimatedNetworkFeeNano)}</dd>
        <dt>{t('Резерв')}</dt>
        <dd>{amount(report.reserveNano)}</dd>
        <dt>{t('Требуемый баланс')}</dt>
        <dd>
          <strong>{amount(report.requiredBalanceNano)}</strong>
        </dd>
        <dt>{t('Проверенный баланс')}</dt>
        <dd>{amount(report.balanceNano)}</dd>
        <dt>{t('Дефицит с учётом резерва')}</dt>
        <dd>{amount(report.deficitNano)}</dd>
      </dl>
      <p>
        {t(
          'Резерв — временный запас native-v1, не комиссия и не гарантия стоимости.',
        )}
      </p>
      <p>
        {t('Частей / отдельных запросов подписи: {0}', {
          0: report.parts.length,
        })}
      </p>
      <p>
        {t('Срок оценки: до {0}. После истечения нужен новый расчёт.', {
          0: new Date(report.expiresAt * 1000).toLocaleTimeString(
            locale === 'ru' ? 'ru-RU' : 'en-GB',
          ),
        })}
      </p>
      <p>
        {t(
          'Это оценка, а не разрешение на отправку. Средства не зарезервированы; отправка ещё недоступна.',
        )}
      </p>
    </div>
  );
}
