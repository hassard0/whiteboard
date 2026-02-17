import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, template_id, env_id, system_prompt_parts, knowledge_pack, tools } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Programmatically assemble system prompt from template config
    const systemPromptSections = [
      "You are an AI agent running inside an Auth0-secured demo environment.",
      "",
      "## Your Identity",
      `- Template: ${template_id}`,
      `- Environment ID: ${env_id}`,
      "",
      "## Auth0 Rules",
      "- Act only within the scopes provided by the user's Auth0 token",
      "- Request human approval for protected actions (tool calls marked as requiresApproval)",
      "- Explain authorization decisions in plain language",
      "- Never bypass Auth0 controls",
      "",
      "## Your Role",
      ...(system_prompt_parts || []),
      "",
      "## Auth0 Knowledge",
      knowledge_pack || "",
      "",
      "## Available Tools",
      ...(tools || []).map((t: any) => `- **${t.name}**: ${t.description} (scopes: ${t.scopes.join(", ")})${t.requiresApproval ? " [REQUIRES APPROVAL]" : ""}`),
      "",
      "## Response Guidelines",
      "- After each action, explain what Auth0 did and why",
      "- When a tool requires approval, explain the Auth0 feature that enables this",
      "- Use markdown formatting for clarity",
      "- Be conversational but professional",
    ];

    const systemPrompt = systemPromptSections.join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("demo-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
