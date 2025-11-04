let configCache: any = null;

export async function getConfig() {
  if (configCache) return configCache;
  const configResp = await fetch('/config.json');
  if (!configResp.ok) throw new Error('Could not load config.json');
  configCache = await configResp.json();
  return configCache;
}
