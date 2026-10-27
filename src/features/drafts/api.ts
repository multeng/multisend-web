import { z } from 'zod';
import type {
  AuthUser,
  DraftDetail,
  DraftInput,
  DraftMetadata,
  DraftUpdate,
} from '../../api/generated';
import { request } from '../../api/request';

const metadata = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  version: z.string().regex(/^[1-9][0-9]{0,17}$/),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}) satisfies z.ZodType<DraftMetadata>;
const detail: z.ZodType<DraftDetail> = metadata.extend({
  recipients: z
    .array(
      z.object({
        address: z.string().max(128),
        amount: z.string().max(128),
        comment: z.string().max(500),
      }),
    )
    .max(200),
});
const list = z.object({ items: z.array(metadata).max(100) });
export const draftKeys = {
  list: (user: AuthUser) =>
    ['private', user.id, user.address, user.network, 'drafts'] as const,
  detail: (user: AuthUser, id: string) =>
    [...draftKeys.list(user), id] as const,
};
const path = (id: string) => `/api/drafts/${encodeURIComponent(id)}`;
export const draftsApi = {
  list: (signal: AbortSignal) => request('/api/drafts', list, { signal }),
  get: (id: string, signal: AbortSignal) =>
    request(path(id), detail, { signal }),
  create: (input: DraftInput, csrf: string, signal: AbortSignal) =>
    request('/api/drafts', detail, {
      method: 'POST',
      body: input,
      csrf,
      signal,
    }),
  update: (id: string, input: DraftUpdate, csrf: string, signal: AbortSignal) =>
    request(path(id), detail, { method: 'PUT', body: input, csrf, signal }),
  remove: (id: string, version: string, csrf: string, signal: AbortSignal) =>
    request(
      `${path(id)}?version=${encodeURIComponent(version)}`,
      z.undefined(),
      { method: 'DELETE', csrf, signal },
    ),
};
