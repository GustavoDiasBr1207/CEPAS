const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];

const isLocalHostname = (hostname = '') => {
  const normalized = hostname.trim().toLowerCase();
  return (
    LOCAL_HOSTNAMES.includes(normalized) ||
    normalized.endsWith('.local') ||
    normalized.startsWith('localhost')
  );
};

const isLocalUrl = (url = '') => {
  try {
    const { hostname } = new URL(url);
    return isLocalHostname(hostname);
  } catch (error) {
    // If the URL cannot be parsed just treat it as non-local.
    return false;
  }
};

const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL?.trim();
  const hasWindow = typeof window !== 'undefined' && typeof window.location !== 'undefined';

  if (envUrl && envUrl.length > 0) {
    if (hasWindow && !isLocalHostname(window.location.hostname) && isLocalUrl(envUrl)) {
      // Ignore localhost overrides when we are clearly running on a public host.
    } else {
      return envUrl;
    }
  }

  if (hasWindow) {
    const { protocol, hostname } = window.location;
    const apiPort = '3001';
    return `${protocol}//${hostname}:${apiPort}/api`;
  }

  return 'http://localhost:3001/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export default API_BASE_URL;
