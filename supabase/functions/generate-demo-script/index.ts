import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template, autopilotScript, customDemo } = await req.json();

    const templateName = template?.name || "AI Agent Demo";
    const templateDesc = template?.description || "";
    const tools = template?.tools || [];
    const auth0Features = template?.auth0Features || [];
    const steps = autopilotScript?.steps || [];

    // Build a detailed prompt for the AI
    const toolsText = tools.map((t: any) =>
      `- **${t.name}** (scopes: ${t.scopes?.join(", ")})${t.requiresApproval ? " — REQUIRES APPROVAL" : ""}: ${t.description}`
    ).join("\n");

    const featuresText = auth0Features.map((f: any) =>
      `- **${f.name}**: ${f.description}`
    ).join("\n");

    const stepsText = steps.length > 0
      ? steps.map((s: any, i: number) =>
        `Step ${i + 1}: ${s.label}\n  User says: "${s.userMessage}"\n  Auth0 feature: ${s.highlightFeature || "N/A"}\n  Technical context: ${s.explanation}`
      ).join("\n\n")
      : "No pre-scripted steps. This is a freeform demo.";

    const customerContext = customDemo?.customerName
      ? `This demo is tailored for: **${customDemo.customerName}**`
      : "This is a general prospect demo.";

    const systemPrompt = `You are an expert Sales Engineer at Auth0 (by Okta), writing a detailed internal demo script for a colleague who will be presenting this AI agent demo to a prospect. Write in a professional but conversational tone suitable for a sales engineering presenter. Use markdown formatting with clear sections and headers.`;

    const userPrompt = `Create a comprehensive, step-by-step demo script for the "${templateName}" demo.

${customerContext}

## Demo Overview
${templateDesc}

## Tools Available in This Demo
${toolsText}

## Auth0 Features Being Demonstrated
${featuresText}

## Walkthrough Steps
${stepsText}

---

Please write a complete demo script that includes:

1. **Opening Hook** (30 seconds): A compelling opening statement that sets the scene for why AI agents need identity security. Make it relevant to the customer's pain points.

2. **Context Setting** (1 minute): Explain what we're about to see, what the AI agent does, and why Auth0 is the right identity layer for agentic AI.

3. **Step-by-Step Walkthrough**: For each walkthrough step, write:
   - What to say to the audience (verbatim talking points)
   - What Auth0 is doing behind the scenes (technical explanation for the presenter to reference)
   - The **business value for the customer** (why this matters to the company buying Auth0)
   - The **end-user value** (how this makes life better/safer/more convenient for their users)
   - Any live demo actions to perform in the UI

4. **Handling the Approval Gate** (if applicable): Detailed talking points for when the approval modal appears — this is a key wow moment. Emphasize human-in-the-loop, the risk of AI agents without this, and how Auth0 solves it elegantly.

5. **Auth0 Feature Deep Dives**: For each Auth0 feature shown, provide 2-3 sentences the presenter can say if a prospect asks "how does that actually work?"

6. **Competitive Differentiation**: 2-3 points on why Auth0's approach to AI agent authorization is superior to building it yourself or using a competitor.

7. **Closing & Discovery Questions**: 3-5 discovery questions to ask the prospect after the demo to understand their pain points and buying intent.

8. **Common Objections & Responses**: Address 3 common objections (e.g., "We can build this ourselves", "We already have an IAM solution", "Our AI vendor handles security").

Make this script detailed enough that a new SE could pick it up and run the demo confidently. Keep each talking point concise but impactful. Total length should be 800-1200 words.`;

    // Call AI via Lovable AI proxy
    const aiResponse = await fetch("https://proxy.lovable.dev/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-5-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`AI error: ${err}`);
    }

    const aiData = await aiResponse.json();
    const script = aiData.choices?.[0]?.message?.content || "Script generation failed.";

    return new Response(JSON.stringify({ script, templateName }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-demo-script error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
