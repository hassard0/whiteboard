// Auth0 configuration — values come from VITE_ env vars
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "",
  redirectUri: window.location.origin,
  audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN || ""}/api/v2/`,
};
