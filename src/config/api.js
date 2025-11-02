const resolveApiBaseUrl = () => {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export default API_BASE_URL;
