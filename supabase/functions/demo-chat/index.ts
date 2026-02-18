import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function executeMockTool(toolId: string, args: Record<string, unknown>): Record<string, unknown> {
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  const uid = () => Math.random().toString(36).slice(2, 8).toUpperCase();

  const mocks: Record<string, () => Record<string, unknown>> = {
    // ── Travel ──────────────────────────────────────────────────────────────
    search_flights: () => ({
      query: { from: args.origin || "JFK", to: args.destination || "SFO", date: args.date || "2026-03-15", passengers: args.passengers || 1 },
      flights: [
        { airline: "United Airlines", flight: "UA 2451", depart: "10:30 AM", arrive: "2:45 PM", duration: "6h 15m", price: "$342", class: "Economy", seats_left: 4 },
        { airline: "Delta",           flight: "DL 1892", depart: "1:15 PM",  arrive: "5:30 PM",  duration: "6h 15m", price: "$289", class: "Economy", seats_left: 9 },
        { airline: "American",        flight: "AA 776",  depart: "6:00 PM",  arrive: "10:15 PM", duration: "6h 15m", price: "$415", class: "Business", seats_left: 2 },
      ],
    }),
    book_flight: () => ({
      confirmation_code: "BK-" + uid(),
      status: "confirmed",
      flight: args.flight_id || "UA 2451",
      passenger: args.passenger_name || "John Smith",
      seat: rand(["14A", "22C", "31F", "8B"]),
      charged: args.price || "$342.00",
      ticket_url: "https://airline.example/ticket/" + uid(),
    }),
    search_hotels: () => ({
      query: { location: args.city || "San Francisco", check_in: args.check_in || "2026-03-15", check_out: args.check_out || "2026-03-18", guests: args.guests || 1 },
      hotels: [
        { name: "The Ritz-Carlton", stars: 5, price_per_night: "$450", total: "$1,350", available: true, amenities: ["spa", "pool", "gym"] },
        { name: "Marriott Downtown", stars: 4, price_per_night: "$189", total: "$567", available: true, amenities: ["gym", "breakfast"] },
        { name: "Holiday Inn Express", stars: 3, price_per_night: "$129", total: "$387", available: true, amenities: ["parking", "wifi"] },
      ],
    }),
    book_hotel: () => ({
      confirmation_code: "HT-" + uid(),
      status: "confirmed",
      hotel: args.hotel_name || "Marriott Downtown",
      check_in: args.check_in || "2026-03-15",
      check_out: args.check_out || "2026-03-18",
      nights: 3,
      total_charged: "$567.00",
    }),
    get_itinerary: () => ({
      trips: [
        { destination: "San Francisco, CA", dates: "Mar 15–18", flight: "UA 2451", hotel: "Marriott Downtown", status: "upcoming" },
        { destination: "New York, NY",      dates: "Apr 2–4",   flight: "DL 891",  hotel: "The Standard",    status: "upcoming" },
      ],
    }),
    // ── Productivity ─────────────────────────────────────────────────────────
    read_calendar: () => ({
      date: args.date || new Date().toISOString().slice(0, 10),
      events: [
        { title: "Team Standup",    time: "9:00 AM",  duration: "30 min", attendees: 5 },
        { title: "Product Review",  time: "2:00 PM",  duration: "1 hr",   attendees: 8 },
        { title: "1:1 with Sarah",  time: "4:30 PM",  duration: "30 min", attendees: 2 },
      ],
    }),
    schedule_meeting: () => ({
      event_id: "evt_" + uid(),
      status: "created",
      title: args.title || "Meeting",
      time: args.time || "Tomorrow at 10:00 AM",
      calendar: "primary",
      invite_sent_to: args.attendees || [],
    }),
    draft_email: () => ({
      draft_id: "draft_" + uid(),
      status: "saved_as_draft",
      subject: args.subject || "(no subject)",
      to: args.to || [],
      body_preview: String(args.body || "").slice(0, 80) + "…",
      word_count: Math.floor(Math.random() * 120) + 40,
    }),
    send_email: () => ({
      message_id: "msg_" + uid(),
      status: "sent",
      to: args.to || [],
      subject: args.subject || "(no subject)",
      delivered: true,
      timestamp: new Date().toISOString(),
    }),
    search_contacts: () => ({
      query: args.query || "",
      results: [
        { name: "Jane Smith",  email: "jane.smith@corp.com",  role: "VP Engineering",   company: "Acme Inc" },
        { name: "Bob Wilson",  email: "bob.wilson@corp.com",  role: "Product Manager",   company: "Acme Inc" },
        { name: "Maria Lopez", email: "m.lopez@external.com", role: "Account Executive", company: "Partner Co" },
      ],
    }),
    // ── E-commerce ────────────────────────────────────────────────────────────
    search_products: () => ({
      query: args.query || "",
      results: [
        { sku: "WH-1000XM5", name: "Premium Wireless Headphones", price: "$299", rating: 4.8, in_stock: true },
        { sku: "FW-SENSE-3",  name: "Smart Fitness Watch",         price: "$199", rating: 4.6, in_stock: true },
        { sku: "NE-QC45",     name: "Noise-Canceling Earbuds",     price: "$149", rating: 4.7, in_stock: false },
      ],
    }),
    get_recommendations: () => ({
      based_on: args.context || "browsing history",
      items: [
        { name: "Noise-Canceling Earbuds",  price: "$149", match_score: "95%", reason: "Complements your headphones" },
        { name: "USB-C Charging Dock",      price: "$49",  match_score: "88%", reason: "Frequently bought together" },
        { name: "Carrying Case (Premium)",  price: "$29",  match_score: "82%", reason: "Top accessory for WH-1000XM5" },
      ],
    }),
    add_to_cart: () => ({
      cart_id: "cart_" + uid(),
      item_added: args.product_name || args.sku || "Product",
      quantity: args.quantity || 1,
      cart_items: 2,
      subtotal: "$348.00",
    }),
    place_order: () => ({
      order_id: "ORD-" + uid(),
      status: "processing",
      items: args.items || [{ name: "Premium Wireless Headphones", qty: 1, price: "$299" }],
      shipping: "Standard (3–5 days)",
      total: "$318.93",
      estimated_delivery: "Mar 19, 2026",
    }),
    track_order: () => ({
      order_id: args.order_id || "ORD-A1B2C3",
      status: "shipped",
      carrier: "UPS",
      tracking_number: "1Z" + uid(),
      last_location: "Louisville, KY",
      estimated_delivery: "Mar 12, 2026",
      events: [
        { date: "Mar 10", event: "Package shipped from warehouse" },
        { date: "Mar 11", event: "In transit — Louisville hub" },
      ],
    }),
    // ── Dev / Code ────────────────────────────────────────────────────────────
    list_repos: () => ({
      org: args.org || "my-org",
      repos: [
        { name: "auth0-ai-demo",  language: "TypeScript", stars: 42, open_prs: 3, last_commit: "2h ago" },
        { name: "api-gateway",    language: "Go",         stars: 18, open_prs: 1, last_commit: "1d ago" },
        { name: "data-pipeline",  language: "Python",     stars: 7,  open_prs: 0, last_commit: "3d ago" },
      ],
    }),
    create_commit: () => ({
      sha: uid().toLowerCase(),
      branch: args.branch || "main",
      message: args.message || "Update code",
      files_changed: Math.floor(Math.random() * 6) + 1,
      additions: Math.floor(Math.random() * 80) + 5,
      deletions: Math.floor(Math.random() * 20),
    }),
    trigger_deploy: () => ({
      deployment_id: "dep_" + uid().toLowerCase(),
      status: "deploying",
      environment: args.environment || "staging",
      branch: args.branch || "main",
      triggered_by: "AI Agent",
      estimated_duration: "~3 min",
    }),
    generate_docs: () => ({
      pages_generated: Math.floor(Math.random() * 10) + 8,
      format: args.format || "markdown",
      output_dir: "docs/",
      status: "complete",
      coverage: "94%",
    }),
    review_pr: () => ({
      pr: args.pr_number ? `#${args.pr_number}` : "#42",
      title: args.title || "Add feature X",
      verdict: rand(["approved", "changes_requested"]),
      comments: Math.floor(Math.random() * 5) + 1,
      files_reviewed: Math.floor(Math.random() * 12) + 2,
      summary: "Logic looks sound. Minor style nits flagged inline.",
    }),
    // ── Healthcare ────────────────────────────────────────────────────────────
    get_patient_records: () => ({
      patient_id: args.patient_id || "PAT-" + uid(),
      name: args.name || "Jane Doe",
      dob: "1985-04-12",
      blood_type: rand(["A+", "B+", "O+", "AB-"]),
      allergies: ["Penicillin"],
      recent_visits: [
        { date: "2026-01-15", reason: "Annual checkup", provider: "Dr. Patel" },
        { date: "2025-10-03", reason: "Flu symptoms",   provider: "Dr. Kim" },
      ],
    }),
    schedule_appointment: () => ({
      appointment_id: "APT-" + uid(),
      status: "confirmed",
      patient: args.patient_name || "Jane Doe",
      provider: args.provider || "Dr. Patel",
      date: args.date || "2026-03-20",
      time: args.time || "10:00 AM",
      type: args.type || "In-person",
      location: "123 Medical Center Blvd",
    }),
    check_insurance: () => ({
      member_id: "MBR-" + uid(),
      plan: "Blue Shield PPO Gold",
      deductible_remaining: "$350.00",
      out_of_pocket_max: "$2,500.00",
      copay_primary_care: "$20",
      in_network: true,
      coverage_summary: { preventive: "100%", specialist: "80%", emergency: "80%", mental_health: "80%" },
    }),
    // ── Finance ───────────────────────────────────────────────────────────────
    get_account_balance: () => ({
      account_id: args.account_id || "ACC-" + uid(),
      account_type: rand(["Checking", "Savings", "Investment"]),
      balance: "$" + (Math.random() * 50000 + 5000).toFixed(2),
      available: "$" + (Math.random() * 40000 + 4000).toFixed(2),
      currency: "USD",
      as_of: new Date().toISOString(),
    }),
    transfer_funds: () => ({
      transaction_id: "TXN-" + uid(),
      status: "completed",
      from_account: args.from_account || "Checking ****1234",
      to_account: args.to_account || "Savings ****5678",
      amount: args.amount || "$500.00",
      timestamp: new Date().toISOString(),
    }),
    get_transactions: () => ({
      account: args.account_id || "Checking ****1234",
      period: args.period || "last 30 days",
      transactions: [
        { date: "2026-02-15", description: "Amazon.com",         amount: "-$89.99",  category: "Shopping" },
        { date: "2026-02-14", description: "Salary Deposit",     amount: "+$5,200.00", category: "Income" },
        { date: "2026-02-12", description: "Whole Foods Market", amount: "-$143.20", category: "Groceries" },
        { date: "2026-02-10", description: "Netflix",            amount: "-$15.99",  category: "Entertainment" },
      ],
    }),
    // ── Generic fallbacks ─────────────────────────────────────────────────────
    tool_a: () => ({ records_fetched: 42, source: "data-store-alpha", latency_ms: 38, cache_hit: true }),
    tool_b: () => ({ records_written: 1, table: "primary_store", operation: "upsert", success: true }),
    tool_c: () => ({ executed: true, action: args.reason || "Action performed", duration_ms: 124 }),
    tool_d: () => ({ api_response: { status: "200 OK", latency_ms: 45, payload_bytes: 1024 } }),
  };

  const mockFn = mocks[toolId];
  if (mockFn) return mockFn();

  // Smart fallback — derive plausible data from the tool name and args
  const name = toolId.replace(/_/g, " ");
  if (toolId.startsWith("get_") || toolId.startsWith("fetch_") || toolId.startsWith("search_") || toolId.startsWith("list_")) {
    return {
      tool: toolId,
      query: args,
      results: [
        { id: uid(), label: `${name} result 1`, value: rand(["active", "confirmed", "available"]), score: "0.97" },
        { id: uid(), label: `${name} result 2`, value: rand(["active", "confirmed", "available"]), score: "0.84" },
      ],
      total_results: 2,
      latency_ms: Math.floor(Math.random() * 80) + 20,
    };
  }
  if (toolId.startsWith("create_") || toolId.startsWith("add_") || toolId.startsWith("insert_")) {
    return { id: uid(), status: "created", resource: name, input: args, timestamp: new Date().toISOString() };
  }
  if (toolId.startsWith("update_") || toolId.startsWith("set_") || toolId.startsWith("edit_")) {
    return { id: uid(), status: "updated", resource: name, changes: args, timestamp: new Date().toISOString() };
  }
  if (toolId.startsWith("delete_") || toolId.startsWith("remove_") || toolId.startsWith("cancel_")) {
    return { id: uid(), status: "deleted", resource: name, timestamp: new Date().toISOString() };
  }
  if (toolId.startsWith("send_") || toolId.startsWith("notify_") || toolId.startsWith("trigger_")) {
    return { id: uid(), status: "sent", resource: name, delivered: true, timestamp: new Date().toISOString() };
  }

  // Last resort
  return { status: "success", tool: toolId, args_received: args, result_id: uid(), timestamp: new Date().toISOString() };
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

      // If the first streaming call already produced narration content, use it directly.
      // Only make a second call if there's NO content at all (avoids doubling rate limit usage).
      const autoExecuted = processedCalls.filter((tc: any) => tc.type === "executed");
      let narration = fullContent;

      if (autoExecuted.length > 0 && !narration) {
        // Build a single follow-up call that includes tool results inline as a user turn.
        // This replaces the old "second narration call" pattern and counts as only one API call.
        const toolResultSummary = autoExecuted
          .map((tc: any) => `**${tc.tool_name}** result:\n\`\`\`json\n${JSON.stringify(tc.result, null, 2)}\n\`\`\``)
          .join("\n\n");

        const narrationMessages = [
          ...allMessages,
          {
            role: "user" as const,
            content: `The following tools ran automatically. Present results to the user using markdown tables where helpful, then add a brief Auth0 explainer callout.\n\n${toolResultSummary}`,
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
              // No tools here — pure narration, keeps the call lightweight
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
