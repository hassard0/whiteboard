import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function executeMockTool(toolId: string, args: Record<string, unknown>): Record<string, unknown> {
  const mocks: Record<string, () => Record<string, unknown>> = {
    search_flights: () => ({
      flights: [
        { airline: "United Airlines", flight: "UA 2451", depart: "10:30 AM", arrive: "2:45 PM", price: "$342", class: "Economy" },
        { airline: "Delta", flight: "DL 1892", depart: "1:15 PM", arrive: "5:30 PM", price: "$289", class: "Economy" },
        { airline: "American Airlines", flight: "AA 776", depart: "6:00 PM", arrive: "10:15 PM", price: "$415", class: "Business" },
      ],
    }),
    book_flight: () => ({ confirmation: "BK-" + Math.random().toString(36).slice(2, 8).toUpperCase(), status: "confirmed", charged: "$342.00" }),
    search_hotels: () => ({
      hotels: [
        { name: "The Ritz-Carlton", rating: "5★", price: "$450/night", available: true },
        { name: "Marriott Downtown", rating: "4★", price: "$189/night", available: true },
        { name: "Holiday Inn Express", rating: "3★", price: "$129/night", available: true },
      ],
    }),
    book_hotel: () => ({ confirmation: "HT-" + Math.random().toString(36).slice(2, 8).toUpperCase(), status: "confirmed", nights: 3, total: "$567.00" }),
    get_itinerary: () => ({ trips: [{ destination: "San Francisco", dates: "Mar 15-18", status: "upcoming" }] }),
    read_calendar: () => ({
      events: [
        { title: "Team Standup", time: "9:00 AM", duration: "30min" },
        { title: "Product Review", time: "2:00 PM", duration: "1hr" },
      ],
    }),
    schedule_meeting: () => ({ event_id: "evt_" + Math.random().toString(36).slice(2, 8), status: "created", calendar: "primary" }),
    draft_email: () => ({ draft_id: "draft_" + Math.random().toString(36).slice(2, 8), status: "saved_as_draft" }),
    send_email: () => ({ message_id: "msg_" + Math.random().toString(36).slice(2, 8), status: "sent", delivered: true }),
    search_contacts: () => ({ contacts: [{ name: "Jane Smith", email: "jane@example.com" }, { name: "Bob Wilson", email: "bob@example.com" }] }),
    search_products: () => ({
      products: [
        { name: "Premium Wireless Headphones", price: "$299", rating: "4.8★" },
        { name: "Smart Fitness Watch", price: "$199", rating: "4.6★" },
      ],
    }),
    get_recommendations: () => ({ recommendations: [{ name: "Noise-Canceling Earbuds", price: "$149", match: "95%" }] }),
    add_to_cart: () => ({ cart_items: 1, subtotal: "$299.00" }),
    place_order: () => ({ order_id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(), status: "processing", total: "$299.00" }),
    track_order: () => ({ order_id: "ORD-A1B2C3", status: "shipped", eta: "Mar 12" }),
    list_repos: () => ({ repos: [{ name: "auth0-ai-demo", language: "TypeScript", stars: 42 }, { name: "api-gateway", language: "Go", stars: 18 }] }),
    create_commit: () => ({ sha: "a1b2c3d", branch: "main", message: args.message || "Update code" }),
    trigger_deploy: () => ({ deployment_id: "dep_" + Math.random().toString(36).slice(2, 8), status: "deploying", environment: "staging" }),
    generate_docs: () => ({ pages_generated: 12, format: "markdown", status: "complete" }),
    review_pr: () => ({ pr: "#42", verdict: "approved", comments: 3 }),
    tool_a: () => ({ records: 42, source: "data-store-alpha" }),
    tool_b: () => ({ written: true, records_affected: 1 }),
    tool_c: () => ({ executed: true, result: "Action completed successfully" }),
    tool_d: () => ({ api_response: { status: "ok", latency: "45ms" } }),
  };
  return (mocks[toolId] || (() => ({ result: "Tool executed successfully" })))();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, template_id, env_id, system_prompt_parts, knowledge_pack, tools, pending_approvals } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build tool definitions for the AI model
    const aiTools = (tools || []).map((t: any) => ({
      type: "function" as const,
      function: {
        name: t.id,
        description: `${t.description}. Scopes: ${t.scopes.join(", ")}. ${t.requiresApproval ? "REQUIRES USER APPROVAL before execution." : ""}`,
        parameters: {
          type: "object",
          properties: {
            reason: { type: "string", description: "Brief explanation of why you're using this tool" },
          },
          required: ["reason"],
          additionalProperties: true,
        },
      },
    }));

    // Assemble system prompt
    const systemPrompt = [
      "You are an AI agent running inside an Auth0-secured demo environment.",
      "",
      `Template: ${template_id} | Environment: ${env_id}`,
      "",
      "## Rules",
      "- Use tools when the user asks for actions. Don't just describe — actually call the tool.",
      "- For tools requiring approval, call them and the system handles the approval modal.",
      "- After tool results, narrate what happened and explain which Auth0 feature enabled it.",
      "",
      "## Your Role",
      ...(system_prompt_parts || []),
      "",
      "## Auth0 Knowledge",
      knowledge_pack || "",
      "",
      "## Response Format",
      "- Use clean markdown: headers, bullet points, bold for emphasis",
      "- Present data in tables when showing lists (flights, hotels, products)",
      "- Keep responses concise and professional",
      "- After tool use, add a brief Auth0 explainer callout like: > 🔐 **Auth0**: [feature] — [explanation]",
    ].join("\n");

    // Build message list
    const allMessages: any[] = [{ role: "system", content: systemPrompt }];

    // Add conversation messages
    for (const msg of messages) {
      allMessages.push({ role: msg.role, content: msg.content });
    }

    // Inject approval results as a system message (avoids tool message format issues)
    if (pending_approvals && pending_approvals.length > 0) {
      const approvalSummaries = pending_approvals.map((a: any) => {
        if (a.decision === "approved") {
          const result = executeMockTool(a.tool_id, a.args || {});
          return `Tool "${a.tool_id}" was APPROVED and executed. Result:\n${JSON.stringify(result, null, 2)}`;
        } else {
          return `Tool "${a.tool_id}" was DENIED by the user. Acknowledge the denial and suggest alternatives.`;
        }
      });

      allMessages.push({
        role: "user",
        content: `[SYSTEM: Tool execution results]\n${approvalSummaries.join("\n\n")}\n\nPlease summarize the results to the user in a clear, well-formatted way. Explain what Auth0 did at each step.`,
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: allMessages,
        tools: aiTools.length > 0 ? aiTools : undefined,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error: " + t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consume stream to detect tool calls
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let toolCalls: any[] = [];
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          if (delta?.content) fullContent += delta.content;
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const i = tc.index ?? 0;
              if (!toolCalls[i]) toolCalls[i] = { id: tc.id || "", function: { name: "", arguments: "" } };
              if (tc.id) toolCalls[i].id = tc.id;
              if (tc.function?.name) toolCalls[i].function.name += tc.function.name;
              if (tc.function?.arguments) toolCalls[i].function.arguments += tc.function.arguments;
            }
          }
        } catch { /* partial chunk */ }
      }
    }

    // Process tool calls
    if (toolCalls.length > 0) {
      const toolsConfig = tools || [];
      const processedCalls = toolCalls.map((tc: any) => {
        const toolConfig = toolsConfig.find((t: any) => t.id === tc.function.name);
        let args = {};
        try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}

        if (toolConfig?.requiresApproval) {
          return {
            type: "approval_required",
            tool_id: tc.function.name,
            tool_name: toolConfig.name,
            tool_description: toolConfig.description,
            scopes: toolConfig.scopes,
            args,
            auth0_feature: "Async Authorization",
          };
        } else {
          const result = executeMockTool(tc.function.name, args);
          return {
            type: "executed",
            tool_id: tc.function.name,
            tool_name: toolConfig?.name || tc.function.name,
            tool_description: toolConfig?.description || "",
            scopes: toolConfig?.scopes || [],
            args,
            result,
          };
        }
      });

      // For auto-executed tools, get a narration from the AI
      const autoExecuted = processedCalls.filter((tc: any) => tc.type === "executed");
      let narration = fullContent;

      if (autoExecuted.length > 0 && !narration) {
        const narrationMessages = [
          ...allMessages,
          {
            role: "user",
            content: `[SYSTEM: Tools executed automatically]\n${autoExecuted.map((tc: any) =>
              `Tool "${tc.tool_name}" executed. Result: ${JSON.stringify(tc.result, null, 2)}`
            ).join("\n\n")}\n\nPresent these results clearly to the user using markdown tables where appropriate. Add Auth0 explainer.`,
          },
        ];

        try {
          const narrationResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: narrationMessages,
            }),
          });
          if (narrationResp.ok) {
            const narrationData = await narrationResp.json();
            narration = narrationData.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("Narration error:", e);
        }
      }

      return new Response(JSON.stringify({
        content: narration,
        tool_calls: processedCalls,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ content: fullContent, tool_calls: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("demo-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
