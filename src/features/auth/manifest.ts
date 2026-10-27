export function siteManifest(value: string) {
  if (!value) return null;
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('VITE_PUBLIC_SITE_URL must be a public HTTPS origin');
  return {
    url: url.origin,
    name: 'TON Multisend',
    iconUrl: `${url.origin}/tonconnect-icon.png`,
  };
}
