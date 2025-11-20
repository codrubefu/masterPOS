let configCache: any = null;

export async function getConfig() {
  if (configCache) return configCache;
  
  let configFile: string;
  const hostname = window.location.hostname;
  
  if (hostname.includes('192.168.1.35')) {
    configFile = '/config-local.json';
  } else if (hostname.includes('localhost')) {
    configFile = '/config-dev.json';
  } else {
    configFile = '/config-web.json';
  }
  
  const configResp = await fetch(configFile);
  if (!configResp.ok) throw new Error(`Could not load ${configFile}`);
  configCache = await configResp.json();
  return configCache;
}
