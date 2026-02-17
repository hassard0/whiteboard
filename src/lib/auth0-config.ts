const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export interface Auth0Config {
  domain: string;
  clientId: string;
  redirectUri: string;
  audience: string;
}

let cachedConfig: { domain: string; clientId: string } | null = null;

export async function fetchAuth0Config(): Promise<{ domain: string; clientId: string }> {
  if (cachedConfig) return cachedConfig;

  // First try env vars (works in local dev)
  const envDomain = import.meta.env.VITE_AUTH0_DOMAIN || "";
  const envClientId = import.meta.env.VITE_AUTH0_CLIENT_ID || "";
  
  if (envDomain && envClientId) {
    cachedConfig = { domain: envDomain, clientId: envClientId };
    return cachedConfig;
  }

  // Fetch from backend function
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/get-auth0-config`, {
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    const data = await res.json();
    cachedConfig = { domain: data.domain, clientId: data.clientId };
    return cachedConfig;
  } catch (e) {
    console.error("Failed to fetch Auth0 config:", e);
    return { domain: "", clientId: "" };
  }
}

// Synchronous getter for backward compat — returns empty until fetched
export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "",
  redirectUri: window.location.origin,
  audience: `https://${import.meta.env.VITE_AUTH0_DOMAIN || ""}/api/v2/`,
};
