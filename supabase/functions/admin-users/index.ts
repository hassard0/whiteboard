import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AUTH0_DOMAIN = Deno.env.get("AUTH0_DOMAIN") || Deno.env.get("VITE_AUTH0_DOMAIN") || "";
const AUTH0_MGMT_CLIENT_ID = Deno.env.get("AUTH0_MGMT_CLIENT_ID") || "";
const AUTH0_MGMT_CLIENT_SECRET = Deno.env.get("AUTH0_MGMT_CLIENT_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

let cachedToken: { token: string; expires: number } | null = null;

async function getMgmtToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;

  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_MGMT_CLIENT_ID,
      client_secret: AUTH0_MGMT_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to get management token:", err);
    throw new Error(`Failed to get management token: ${err}`);
  }

  const data = await res.json();
  cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
  return cachedToken.token;
}

async function verifyAdmin(authHeader: string | null): Promise<{ ok: boolean; sub?: string }> {
  if (!authHeader) {
    console.log("verifyAdmin: no auth header");
    return { ok: false };
  }

  const token = authHeader.replace("Bearer ", "");

  // Decode JWT payload — works for both Auth0 RS256 JWTs and regular JWTs
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.log("verifyAdmin: token is not a JWT (opaque token?) - parts:", parts.length);
      return { ok: false };
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    const auth0Sub = payload.sub;

    console.log("verifyAdmin: decoded sub =", auth0Sub);

    if (!auth0Sub) {
      console.log("verifyAdmin: no sub in token payload");
      return { ok: false };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("auth0_sub", auth0Sub)
      .eq("role", "admin")
      .maybeSingle();

    if (error) console.error("verifyAdmin: db error", error);
    console.log("verifyAdmin: role lookup result =", data);

    return { ok: !!data, sub: auth0Sub };
  } catch (e) {
    console.error("verifyAdmin: exception", e);
    return { ok: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const { ok: isAdmin } = await verifyAdmin(req.headers.get("Authorization"));
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    const token = await getMgmtToken();
    const mgmtBase = `https://${AUTH0_DOMAIN}/api/v2`;

    // ── LIST USERS ──
    if (req.method === "GET" && action === "list") {
      const page = url.searchParams.get("page") || "0";
      const perPage = url.searchParams.get("per_page") || "50";
      const res = await fetch(
        `${mgmtBase}/users?page=${page}&per_page=${perPage}&include_totals=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Management API error listing users");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CREATE USER ──
    if (req.method === "POST" && action === "create") {
      const body = await req.json();
      const res = await fetch(`${mgmtBase}/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          connection: body.connection || "Username-Password-Authentication",
          email: body.email,
          name: body.name || body.email,
          password: body.password || `TempPass${Math.random().toString(36).slice(2, 10)}!1`,
          email_verified: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── INVITE USER ──
    if (req.method === "POST" && action === "invite") {
      const body = await req.json();
      const createRes = await fetch(`${mgmtBase}/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          connection: "Username-Password-Authentication",
          email: body.email,
          name: body.name || body.email,
          password: `TempPass${Math.random().toString(36).slice(2, 10)}!1A`,
          email_verified: false,
        }),
      });
      const createdUser = await createRes.json();
      if (!createRes.ok) throw new Error(createdUser.message || "Failed to create user for invite");

      const ticketRes = await fetch(`${mgmtBase}/tickets/password-change`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: createdUser.user_id,
          mark_email_as_verified: true,
        }),
      });
      const ticketData = await ticketRes.json();
      return new Response(JSON.stringify({ user: createdUser, ticket: ticketData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── UPDATE USER ──
    if (req.method === "PATCH" && action === "update") {
      const body = await req.json();
      const { userId, ...updates } = body;
      if (!userId) throw new Error("userId required");
      const res = await fetch(`${mgmtBase}/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update user");
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE USER ──
    if (req.method === "DELETE" && action === "delete") {
      const body = await req.json();
      const { userId } = body;
      if (!userId) throw new Error("userId required");
      const res = await fetch(`${mgmtBase}/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete user");
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("admin-users error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
