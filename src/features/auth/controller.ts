import type { AuthSession, TonProof } from '../../api/generated';
import { authApi, type AuthApi } from './api';

export type ConnectedWallet = {
  account: {
    address: string;
    chain: string;
    walletStateInit: string;
    publicKey?: string;
  };
  connectItems?: { tonProof?: { proof: TonProof } | { error: unknown } };
};
export type Connector = {
  wallet: ConnectedWallet | null;
  connectionRestored: Promise<boolean>;
  onStatusChange(
    callback: (wallet: ConnectedWallet | null) => void,
  ): () => void;
  disconnect(): Promise<void>;
  setConnectRequestParameters(
    value: { state: 'ready'; value: { tonProof: string } } | null,
  ): void;
  openModal(): Promise<void>;
};
type State = {
  session: AuthSession | null;
  phase: 'loading' | 'idle' | 'preparing' | 'waiting' | 'verifying' | 'error';
  error: string | null;
};

export class AuthController {
  private state: State = { session: null, phase: 'loading', error: null };
  private listeners = new Set<() => void>();
  private generation = 0;
  private request = new AbortController();
  private unsubscribe?: () => void;
  private pending?: { payload: string; expiresAt: number };
  constructor(
    private connector: Connector | null,
    private clearPrivate: () => void,
    private api: AuthApi = authApi,
  ) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(change: Partial<State>) {
    this.state = { ...this.state, ...change };
    this.listeners.forEach((listener) => listener());
  }
  private next() {
    this.request.abort();
    this.request = new AbortController();
    this.pending = undefined;
    return ++this.generation;
  }
  async start() {
    const generation = this.next();
    this.update({ session: null, phase: 'loading' });
    this.unsubscribe = this.connector?.onStatusChange((wallet) => {
      void this.walletChanged(wallet);
    });
    try {
      const session = await this.api.session(this.request.signal);
      if (this.connector) await this.connector.connectionRestored;
      if (generation !== this.generation) return;
      if (
        session.authenticated &&
        this.connector &&
        !this.matches(this.connector.wallet, session)
      ) {
        this.update({
          session: { authenticated: false, csrfToken: session.csrfToken },
          phase: 'idle',
          error: null,
        });
        await this.logout();
      } else {
        this.update({ session, phase: 'idle', error: null });
      }
    } catch {
      if (generation === this.generation)
        this.update({
          session: null,
          phase: 'error',
          error: 'Не удалось проверить сессию. Повторите вход.',
        });
    }
  }
  stop() {
    this.next();
    this.unsubscribe?.();
  }
  private matches(wallet: ConnectedWallet | null, session: AuthSession) {
    return (
      session.authenticated &&
      wallet?.account.chain === session.user.network &&
      wallet.account.address.toLowerCase() ===
        session.user.address.toLowerCase()
    );
  }
  async login() {
    if (
      !this.connector ||
      ['preparing', 'waiting', 'verifying'].includes(this.state.phase)
    )
      return;
    const generation = this.next();
    this.clearPrivate();
    this.update({ session: this.anonymous(), phase: 'preparing', error: null });
    try {
      const old =
        this.state.session ?? (await this.api.session(this.request.signal));
      await this.api.logout(old.csrfToken, this.request.signal);
      const session = await this.api.session(this.request.signal);
      if (generation !== this.generation) return;
      this.update({ session });
      if (this.connector.wallet) await this.connector.disconnect();
      const challenge = await this.api.challenge(
        session.csrfToken,
        this.request.signal,
      );
      if (generation !== this.generation) return;
      this.pending = {
        payload: challenge.payload,
        expiresAt: Date.parse(challenge.expiresAt),
      };
      // Configure before connecting only: even clearing these parameters can
      // restart the SDK's QR connection. Each new login replaces the payload.
      this.connector.setConnectRequestParameters({
        state: 'ready',
        value: { tonProof: challenge.payload },
      });
      this.update({ phase: 'waiting' });
      await this.connector.openModal();
    } catch {
      if (generation === this.generation)
        this.fail('Не удалось начать вход. Попробуйте ещё раз.');
    }
  }
  private anonymous(): AuthSession | null {
    return this.state.session
      ? { authenticated: false, csrfToken: this.state.session.csrfToken }
      : null;
  }
  private fail(error: string) {
    this.pending = undefined;
    this.update({ session: this.anonymous(), phase: 'error', error });
  }
  private async walletChanged(wallet: ConnectedWallet | null) {
    if (this.state.phase === 'preparing' || this.state.phase === 'loading')
      return;
    if (this.state.phase === 'waiting' && this.pending && wallet) {
      const generation = this.generation;
      const proof = wallet.connectItems?.tonProof;
      if (
        wallet.account.chain !== '-3' ||
        !proof ||
        !('proof' in proof) ||
        proof.proof.payload !== this.pending.payload ||
        Date.now() >= this.pending.expiresAt
      ) {
        this.fail(
          'Нужен testnet-кошелёк с поддержкой подписи входа. Повторите подключение.',
        );
        return;
      }
      this.update({ phase: 'verifying' });
      try {
        const session = await this.api.verify(
          {
            address: wallet.account.address,
            network: '-3',
            publicKey: wallet.account.publicKey,
            stateInit: wallet.account.walletStateInit,
            proof: proof.proof,
          },
          this.state.session!.csrfToken,
          this.request.signal,
        );
        if (generation !== this.generation) return;
        if (
          !this.matches(wallet, session) ||
          !this.matches(this.connector?.wallet ?? null, session)
        )
          throw new Error('Wallet changed');
        this.pending = undefined;
        this.update({ session, phase: 'idle', error: null });
      } catch {
        if (generation === this.generation)
          this.fail('Подпись не подтверждена сервером. Повторите вход.');
      }
    } else if (
      this.state.phase === 'verifying' ||
      (this.state.session?.authenticated &&
        !this.matches(wallet, this.state.session))
    ) {
      await this.logout();
    }
  }
  async logout() {
    const session = this.state.session;
    const generation = this.next();
    this.clearPrivate();
    this.update({ session: this.anonymous(), phase: 'preparing', error: null });
    try {
      const current = session ?? (await this.api.session(this.request.signal));
      await this.api.logout(current.csrfToken, this.request.signal);
      if (this.connector?.wallet) await this.connector.disconnect();
      const fresh = await this.api.session(this.request.signal);
      if (generation === this.generation)
        this.update({ session: fresh, phase: 'idle' });
    } catch {
      if (generation === this.generation)
        this.fail(
          'Сервер не подтвердил выход. Повторите выход при восстановлении связи.',
        );
    }
  }
}
