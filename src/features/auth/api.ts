import { z } from 'zod';
import { request } from '../../api/request';
import type {
  AuthSession,
  AuthChallenge,
  VerifyProofRequest,
} from '../../api/generated';

const csrf = z.string().min(20).max(128);
export const sessionSchema: z.ZodType<AuthSession> = z.discriminatedUnion(
  'authenticated',
  [
    z.object({ authenticated: z.literal(false), csrfToken: csrf }),
    z.object({
      authenticated: z.literal(true),
      csrfToken: csrf,
      user: z.object({
        id: z.uuid(),
        address: z.string().regex(/^-?\d+:[a-fA-F0-9]{64}$/),
        network: z.literal('-3'),
      }),
    }),
  ],
);
const challengeSchema: z.ZodType<AuthChallenge> = z.object({
  payload: z.string().min(32).max(128),
  expiresAt: z.iso.datetime(),
});
export const authApi = {
  session: (signal: AbortSignal) =>
    request('/api/auth/session', sessionSchema, { signal }),
  challenge: (csrf: string, signal: AbortSignal) =>
    request('/api/auth/challenge', challengeSchema, {
      method: 'POST',
      csrf,
      signal,
    }),
  verify: (body: VerifyProofRequest, csrf: string, signal: AbortSignal) =>
    request('/api/auth/verify', sessionSchema, {
      method: 'POST',
      csrf,
      signal,
      body,
    }),
  logout: (csrf: string, signal: AbortSignal) =>
    request('/api/auth/logout', z.undefined(), {
      method: 'POST',
      csrf,
      signal,
    }),
};
export type AuthApi = typeof authApi;
