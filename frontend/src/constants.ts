export const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const BACKEND_URL = API_DOMAIN ? `${location.protocol}//${API_DOMAIN}` : '';
