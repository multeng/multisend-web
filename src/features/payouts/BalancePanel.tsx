import { useEffect, useState } from 'react';
import { Button } from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';
import type { AuthenticatedSession } from '../../api/generated';
import { ApiError } from '../../api/request';
import { useI18n } from '../../i18n/context';
import type { AuthController } from '../auth/controller';
import { formatAmount } from '../recipients/validation';
import { readBalance, type BalanceResult } from './balance';

export function BalancePanel({
  user,
  controller,
  totalNano,
  identity,
}: {
  user: AuthenticatedSession['user'];
  controller: AuthController;
  totalNano: string;
  identity: string;
}) {
  const { t } = useI18n();
  const address = user.address;
  const query = useQuery({
    queryKey: ['private', user.id, address, user.network, 'balance', identity],
    queryFn: ({ signal }) => readBalance(address, signal),
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
  return (
    <section aria-label={t('Баланс кошелька')}>
      <h4>{t('Баланс кошелька')}</h4>
      <Button
        type="button"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        {query.isFetching ? t('Проверяем баланс…') : t('Проверить баланс')}
      </Button>
      {query.isError && (
        <p role="alert">
          {t('Не удалось проверить баланс. Повторите проверку позднее.')}
        </p>
      )}
      {query.data && !query.isFetching && !query.isError && (
        <BalanceResultView
          key={query.data.validUntil}
          result={query.data}
          totalNano={totalNano}
        />
      )}
      <p>
        {t(
          'Сетевые расходы не учтены. Достаточность средств для отправки ещё не проверена.',
        )}
      </p>
    </section>
  );
}
function BalanceResultView({
  result,
  totalNano,
}: {
  result: BalanceResult;
  totalNano: string;
}) {
  const { t } = useI18n();
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
      <p role="status">{t('Проверка баланса устарела. Проверьте заново.')}</p>
    );
  const { report } = result;
  const shortfall = BigInt(totalNano) - BigInt(report.balanceNano);
  return (
    <div role="status">
      <p>
        {t('Баланс TON:')}{' '}
        <strong>{formatAmount(BigInt(report.balanceNano))} TON</strong>
      </p>
      <p>{t('Состояние кошелька: {0}', { 0: report.accountStatus })}</p>
      {report.accountStatus !== 'ACTIVE' && (
        <p>
          {t(
            'Состояние кошелька не ACTIVE. Возможность отправки не подтверждена.',
          )}
        </p>
      )}
      {shortfall > 0n ? (
        <p>
          {t('Не хватает для суммы получателям:')}{' '}
          <strong>{formatAmount(shortfall)} TON</strong>
        </p>
      ) : (
        <p>
          {t(
            'Сумма получателям покрывается балансом, без учёта сетевых расходов.',
          )}
        </p>
      )}
      <p>
        {t('Проверено на блоке {0}. Снимок действует не более 30 секунд.', {
          0: report.blockSeqno,
        })}
      </p>
    </div>
  );
}
