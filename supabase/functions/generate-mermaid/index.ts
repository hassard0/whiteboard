import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert Mermaid.js diagram generator.
Given a description, return ONLY the raw Mermaid diagram code — no markdown fences, no explanation, no extra text.
Rules:
- Use "graph TD" or "graph LR" for flowcharts, "sequenceDiagram" for sequence diagrams
- Keep node labels short and clear
- Use emoji sparingly and only in quotes when appropriate
- Escape special characters inside labels with quotes where needed
- Avoid colons inside unquoted labels
- Max ~15 nodes for clarity
- Always produce valid Mermaid v11 syntax`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: description },
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }

    const data = await response.json();
    let mermaid = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip any accidental markdown fences (multiline-safe)
    mermaid = mermaid
      .replace(/^```(?:mermaid)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    // If the model still wrapped in a code block somewhere in the middle, extract it
    const fenceMatch = mermaid.match(/```(?:mermaid)?\s*([\s\S]+?)\s*```/i);
    if (fenceMatch) mermaid = fenceMatch[1].trim();

    // Strip any leading prose before the diagram keyword
    const diagramKeywords = ["graph ", "sequenceDiagram", "flowchart ", "erDiagram", "classDiagram", "stateDiagram", "gantt", "pie ", "gitGraph", "mindmap", "timeline", "journey"];
    for (const kw of diagramKeywords) {
      const idx = mermaid.indexOf(kw);
      if (idx > 0) { mermaid = mermaid.slice(idx); break; }
    }

    if (!mermaid) throw new Error("AI returned empty diagram content");

    return new Response(JSON.stringify({ mermaid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[generate-mermaid]", err);
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
