import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function useAuth0ProfileSync() {
  const { user, isAuthenticated } = useAuth0();
  const synced = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub || synced.current) return;
    synced.current = true;

    fetch(`${SUPABASE_URL}/functions/v1/sync-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        auth0_sub: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
      }),
    }).catch(console.error);
  }, [isAuthenticated, user]);
}
