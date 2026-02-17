import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const domain = Deno.env.get("VITE_AUTH0_DOMAIN") || Deno.env.get("AUTH0_DOMAIN") || "";
  const clientId = Deno.env.get("VITE_AUTH0_CLIENT_ID") || Deno.env.get("AUTH0_CLIENT_ID") || "";

  return new Response(JSON.stringify({ domain, clientId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
