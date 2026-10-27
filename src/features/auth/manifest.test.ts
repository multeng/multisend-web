import { expect, it } from 'vitest';
import { siteManifest } from './manifest';

it('keeps wallet login unconfigured until a public HTTPS origin exists', () => {
  expect(siteManifest('')).toBeNull();
  for (const value of [
    'http://localhost:5173',
    'https://user:pass@example.com',
    'https://example.com/path',
    'https://example.com/?key=secret',
  ]) {
    expect(() => siteManifest(value)).toThrow();
  }
  expect(siteManifest('https://example.com/')).toEqual({
    url: 'https://example.com',
    name: 'TON Multisend',
    iconUrl: 'https://example.com/tonconnect-icon.png',
  });
});
