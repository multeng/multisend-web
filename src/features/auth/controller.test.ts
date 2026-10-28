import { expect, it, vi } from 'vitest';
import {
  AuthController,
  type Connector,
  type ConnectedWallet,
} from './controller';
import type { AuthApi } from './api';

const anonymous = { authenticated: false as const, csrfToken: 'a'.repeat(43) };
const user = {
  id: 'a',
  address: '0:' + '1'.repeat(64),
  network: '-3' as const,
};
const authenticated = {
  authenticated: true as const,
  csrfToken: anonymous.csrfToken,
  user,
};
const payload = 'p'.repeat(43);
const wallet: ConnectedWallet = {
  account: { address: user.address, chain: '-3', walletStateInit: 'boc' },
  connectItems: {
    tonProof: {
      proof: {
        timestamp: 1,
        domain: { lengthBytes: 1, value: 'a' },
        signature: 'sig',
        payload,
      },
    },
  },
};

function setup() {
  let callback: (w: ConnectedWallet | null) => void = () => {};
  const api: AuthApi = {
    session: vi.fn().mockResolvedValue(anonymous),
    logout: vi.fn().mockResolvedValue(undefined),
    challenge: vi.fn().mockResolvedValue({
      payload,
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    }),
    verify: vi.fn().mockResolvedValue(authenticated),
  };
  const connector: Connector = {
    wallet: null,
    connectionRestored: Promise.resolve(false),
    onStatusChange: (cb) => {
      callback = cb;
      return () => {};
    },
    disconnect: vi.fn().mockResolvedValue(undefined),
    setConnectRequestParameters: vi.fn(),
    openModal: vi.fn().mockResolvedValue(undefined),
  };
  const clear = vi.fn();
  const controller = new AuthController(connector, clear, api);
  const emit = (w: ConnectedWallet | null) => {
    connector.wallet = w;
    callback(w);
  };
  return { controller, api, connector, clear, emit };
}

it('resets the previous family and requests a challenge before opening the modal', async () => {
  const { controller, api, connector, emit } = setup();
  await controller.start();
  await controller.login();
  expect(api.logout).toHaveBeenCalledBefore(vi.mocked(api.challenge));
  expect(api.challenge).toHaveBeenCalledBefore(vi.mocked(connector.openModal));
  expect(controller.getSnapshot().session?.authenticated).toBe(false);
  emit(wallet);
  await vi.waitFor(() =>
    expect(controller.getSnapshot().session?.authenticated).toBe(true),
  );
  controller.stop();
});

it('never treats restored wallet connection as authentication', async () => {
  const { controller, connector, api } = setup();
  connector.wallet = wallet;
  await controller.start();
  expect(controller.getSnapshot().session?.authenticated).toBe(false);
  expect(api.verify).not.toHaveBeenCalled();
  controller.stop();
});

it('never exposes a persisted server identity when another wallet is restored', async () => {
  const { controller, connector, api } = setup();
  connector.wallet = {
    ...wallet,
    account: { ...wallet.account, address: '0:' + '2'.repeat(64) },
  };
  vi.mocked(api.session).mockResolvedValueOnce(authenticated);
  const identities: boolean[] = [];
  controller.subscribe(() =>
    identities.push(controller.getSnapshot().session?.authenticated ?? false),
  );
  await controller.start();
  expect(identities).not.toContain(true);
  expect(api.logout).toHaveBeenCalled();
  controller.stop();
});

it('rejects unsupported proof and allows a new login after failure', async () => {
  const { controller, emit } = setup();
  await controller.start();
  await controller.login();
  emit({ ...wallet, connectItems: undefined });
  await vi.waitFor(() => expect(controller.getSnapshot().phase).toBe('error'));
  await controller.login();
  emit(wallet);
  await vi.waitFor(() =>
    expect(controller.getSnapshot().session?.authenticated).toBe(true),
  );
  controller.stop();
});

it('clears private data and ignores a late verify result after logout', async () => {
  const { controller, api, emit, clear } = setup();
  let resolve!: (s: typeof authenticated) => void;
  vi.mocked(api.verify).mockReturnValue(
    new Promise((r) => {
      resolve = r;
    }),
  );
  await controller.start();
  await controller.login();
  emit(wallet);
  await controller.logout();
  resolve(authenticated);
  await Promise.resolve();
  expect(controller.getSnapshot().session?.authenticated).toBe(false);
  expect(clear).toHaveBeenCalled();
  controller.stop();
});

it('revokes authentication and clears data on account or network change', async () => {
  const { controller, emit, api, clear } = setup();
  await controller.start();
  await controller.login();
  emit(wallet);
  await vi.waitFor(() =>
    expect(controller.getSnapshot().session?.authenticated).toBe(true),
  );
  emit({ ...wallet, account: { ...wallet.account, chain: '-239' } });
  expect(controller.getSnapshot().session?.authenticated).toBe(false);
  expect(clear).toHaveBeenCalled();
  await vi.waitFor(() => expect(api.logout).toHaveBeenCalledTimes(2));
  controller.stop();
});

// The real UI SDK refreshes the active QR connection when these parameters
// change. Once a wallet connects, that refresh throws WalletAlreadyConnectedError.
function rejectConnectedParameterChanges(connector: Connector) {
  vi.mocked(connector.setConnectRequestParameters).mockImplementation(() => {
    if (connector.wallet) throw new Error('WalletAlreadyConnectedError');
  });
}

it('completes server authentication without restarting the connected wallet', async () => {
  const { controller, connector, emit } = setup();
  rejectConnectedParameterChanges(connector);
  await controller.start();
  await controller.login();
  emit(wallet);
  await vi.waitFor(() => {
    expect(controller.getSnapshot().session?.authenticated).toBe(true);
    expect(controller.getSnapshot().phase).toBe('idle');
  });
  expect(connector.setConnectRequestParameters).toHaveBeenCalledTimes(1);
  controller.stop();
});

it.each([
  ['mainnet', { ...wallet, account: { ...wallet.account, chain: '-239' } }],
  ['missing proof', { ...wallet, connectItems: undefined }],
] as const)(
  'shows an actionable error for %s without restarting the connection',
  async (_, connected) => {
    const { controller, connector, emit, api } = setup();
    rejectConnectedParameterChanges(connector);
    await controller.start();
    await controller.login();
    emit(connected);
    await vi.waitFor(() => {
      expect(controller.getSnapshot().phase).toBe('error');
      expect(controller.getSnapshot().error).toContain('testnet');
    });
    expect(api.verify).not.toHaveBeenCalled();
    controller.stop();
  },
);

it('shows a server verification error and can retry with a fresh challenge', async () => {
  const { controller, connector, emit, api } = setup();
  rejectConnectedParameterChanges(connector);
  vi.mocked(connector.disconnect).mockImplementation(async () => {
    emit(null);
  });
  vi.mocked(api.verify).mockRejectedValueOnce(new Error('Proof rejected'));
  await controller.start();
  await controller.login();
  emit(wallet);
  await vi.waitFor(() => {
    expect(controller.getSnapshot().phase).toBe('error');
    expect(controller.getSnapshot().error).toContain('сервером');
  });
  await controller.login();
  emit(wallet);
  await vi.waitFor(() =>
    expect(controller.getSnapshot().session?.authenticated).toBe(true),
  );
  expect(api.challenge).toHaveBeenCalledTimes(2);
  controller.stop();
});

it('exposes current SDK planning capability and updates it for the same account', async () => {
  const { controller, connector, api, emit } = setup();
  const connected = {
    ...wallet,
    device: { features: [{ name: 'SendTransaction', maxMessages: 4 }] },
  };
  connector.wallet = connected;
  vi.mocked(api.session).mockResolvedValueOnce(authenticated);
  await controller.start();
  expect(controller.getSnapshot().wallet).toEqual({
    address: user.address,
    network: '-3',
    maxMessages: 4,
  });
  const listener = vi.fn();
  const unsubscribe = controller.subscribe(listener);
  emit({
    ...connected,
    device: { features: [{ name: 'SendTransaction', maxMessages: 1 }] },
  });
  expect(controller.getSnapshot().wallet?.maxMessages).toBe(1);
  expect(listener).toHaveBeenCalled();
  emit({ ...connected, device: { features: ['SendTransaction'] } });
  expect(controller.getSnapshot().wallet?.maxMessages).toBeNull();
  for (const limit of [0, -1, 1.5, 256, NaN, '4']) {
    emit({
      ...connected,
      device: { features: [{ name: 'SendTransaction', maxMessages: limit }] },
    });
    expect(controller.getSnapshot().wallet?.maxMessages).toBeNull();
  }
  unsubscribe();
  controller.stop();
});
