import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button } from '@radix-ui/themes';
import { readinessQueryOptions } from '../api/readiness-query';
import styles from './App.module.css';

type Connection = 'checking' | 'ready' | 'not_ready' | 'error';

const connectionCopy: Record<Connection, { title: string; detail: string }> = {
  checking: {
    title: 'Проверяем соединение',
    detail: 'Запрашиваем состояние сервера. Это займёт несколько секунд.',
  },
  ready: {
    title: 'API доступен',
    detail:
      'Сервер ответил. Подготовка и отправка выплат появятся на следующих этапах.',
  },
  not_ready: {
    title: 'API пока не готов',
    detail:
      'Сервер доступен, но ещё не готов к работе. Попробуйте проверить позже.',
  },
  error: {
    title: 'Нет соединения с API',
    detail:
      'Не удалось получить корректный ответ. Вы можете повторить проверку.',
  },
};

export function App({
  account,
  workspace,
}: {
  account?: ReactNode;
  workspace?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const readiness = useQuery(readinessQueryOptions);
  const connection: Connection = readiness.isFetching
    ? 'checking'
    : readiness.isError
      ? 'error'
      : (readiness.data ?? 'checking');

  async function checkAgain() {
    await queryClient.cancelQueries({
      queryKey: readinessQueryOptions.queryKey,
      exact: true,
    });
    await readiness.refetch();
  }

  const copy = connectionCopy[connection];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden="true">
            ↗
          </span>
          <span>TON Multisend</span>
        </div>
        <Badge color="blue" size="2" variant="soft">
          Testnet · в разработке
        </Badge>
      </header>

      <main className={styles.main}>
        {account}
        {workspace}
        <section className={styles.hero} aria-labelledby="page-title">
          <p className={styles.eyebrow}>МЕНЬШЕ РУТИНЫ. БОЛЬШЕ КОНТРОЛЯ.</p>
          <h1 id="page-title">
            Массовые выплаты.
            <br />
            <span>С понятным порядком.</span>
          </h1>
          <p className={styles.intro}>
            Готовим удобный способ отправлять TON нескольким получателям: от
            первого адреса до проверки результата. С телефона и компьютера.
          </p>
          <div className={styles.stage}>
            <span className={styles.stageDot} aria-hidden="true" />
            Сейчас создаём основу приложения
          </div>
        </section>

        <section
          className={styles.features}
          aria-label="Как будет работать сервис"
        >
          <article className={styles.feature}>
            <span className={styles.number}>01 / Подготовить</span>
            <h2>Один список получателей</h2>
            <p>
              Добавляйте адреса вручную или загружайте CSV. Редактируйте список
              даже с телефона.
            </p>
          </article>
          <article className={styles.feature}>
            <span className={styles.number}>02 / Проверить</span>
            <h2>Ошибки видны заранее</h2>
            <p>
              Проверка адресов, сумм и повторов поможет подготовить выплаты
              перед подписью.
            </p>
          </article>
          <article className={styles.feature}>
            <span className={styles.number}>03 / Подписать</span>
            <h2>Контроль у вашего кошелька</h2>
            <p>
              Вы подтверждаете переводы своим кошельком. Сервису не нужны ваши
              приватные ключи.
            </p>
          </article>
        </section>

        <section
          className={styles.connection}
          aria-labelledby="connection-title"
        >
          <div className={styles.connectionHeading}>
            <p className={styles.eyebrow}>ЛОКАЛЬНЫЙ КАРКАС</p>
            <h2 id="connection-title">Соединение с сервером</h2>
          </div>
          <div className={styles.connectionBody}>
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className={styles.status}
            >
              <span className={styles.statusTitle}>
                <span
                  className={styles.indicator}
                  data-state={connection}
                  aria-hidden="true"
                />
                {copy.title}
              </span>
              <p>{copy.detail}</p>
            </div>
            <Button
              size="3"
              variant="outline"
              className={styles.retry}
              onClick={checkAgain}
            >
              Проверить снова
            </Button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>TON Multisend</span>
        <p>
          Разработка начинается с testnet. Отправка средств пока недоступна.
        </p>
        <p>Независимый проект. Не связан с TON Foundation или Telegram.</p>
      </footer>
    </div>
  );
}
