import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_LIBRARY = [
  // Travel
  { id: "search_flights", name: "Search Flights", description: "Search available flights", scopes: ["flights:read"], requiresApproval: false, industry: "travel", mockDelay: 1500 },
  { id: "book_flight", name: "Book Flight", description: "Book a flight on behalf of user", scopes: ["flights:write", "payments:charge"], requiresApproval: true, industry: "travel", mockDelay: 2000 },
  { id: "search_hotels", name: "Search Hotels", description: "Search available hotels", scopes: ["hotels:read"], requiresApproval: false, industry: "travel", mockDelay: 1200 },
  { id: "book_hotel", name: "Book Hotel", description: "Book a hotel on behalf of user", scopes: ["hotels:write", "payments:charge"], requiresApproval: true, industry: "travel", mockDelay: 2000 },
  { id: "get_itinerary", name: "Get Itinerary", description: "Retrieve user's travel itinerary", scopes: ["itinerary:read"], requiresApproval: false, industry: "travel", mockDelay: 800 },
  // Healthcare
  { id: "access_patient_records", name: "Access Patient Records", description: "View patient medical records", scopes: ["records:read", "hipaa:compliant"], requiresApproval: false, industry: "healthcare", mockDelay: 1000 },
  { id: "order_prescription", name: "Order Prescription", description: "Submit a prescription order", scopes: ["rx:write", "clinical:approve"], requiresApproval: true, industry: "healthcare", mockDelay: 2000 },
  { id: "schedule_appointment", name: "Schedule Appointment", description: "Book a patient appointment", scopes: ["calendar:write"], requiresApproval: true, industry: "healthcare", mockDelay: 1500 },
  { id: "check_insurance", name: "Check Insurance", description: "Verify insurance coverage", scopes: ["insurance:read"], requiresApproval: false, industry: "healthcare", mockDelay: 1200 },
  { id: "request_lab_results", name: "Request Lab Results", description: "Retrieve lab test results", scopes: ["labs:read"], requiresApproval: false, industry: "healthcare", mockDelay: 800 },
  // Fintech
  { id: "check_balance", name: "Check Balance", description: "View account balance", scopes: ["accounts:read"], requiresApproval: false, industry: "fintech", mockDelay: 500 },
  { id: "transfer_funds", name: "Transfer Funds", description: "Transfer money between accounts", scopes: ["accounts:write", "payments:transfer"], requiresApproval: true, industry: "fintech", mockDelay: 2500 },
  { id: "view_transactions", name: "View Transactions", description: "List recent transactions", scopes: ["transactions:read"], requiresApproval: false, industry: "fintech", mockDelay: 800 },
  { id: "approve_wire", name: "Approve Wire Transfer", description: "Approve a wire transfer request", scopes: ["wire:approve", "compliance:check"], requiresApproval: true, industry: "fintech", mockDelay: 3000 },
  { id: "generate_report", name: "Generate Report", description: "Generate financial report", scopes: ["reports:write"], requiresApproval: false, industry: "fintech", mockDelay: 2000 },
  // HR
  { id: "search_employees", name: "Search Employees", description: "Search employee directory", scopes: ["employees:read"], requiresApproval: false, industry: "hr", mockDelay: 800 },
  { id: "approve_timeoff", name: "Approve Time Off", description: "Approve a time-off request", scopes: ["timeoff:approve"], requiresApproval: true, industry: "hr", mockDelay: 1500 },
  { id: "update_benefits", name: "Update Benefits", description: "Modify employee benefits", scopes: ["benefits:write"], requiresApproval: true, industry: "hr", mockDelay: 1200 },
  { id: "generate_offer_letter", name: "Generate Offer Letter", description: "Create an employment offer", scopes: ["offers:write", "hr:admin"], requiresApproval: true, industry: "hr", mockDelay: 2000 },
  { id: "check_compliance", name: "Check Compliance", description: "Verify HR compliance status", scopes: ["compliance:read"], requiresApproval: false, industry: "hr", mockDelay: 1000 },
  // Legal
  { id: "search_contracts", name: "Search Contracts", description: "Search contract database", scopes: ["contracts:read"], requiresApproval: false, industry: "legal", mockDelay: 1000 },
  { id: "generate_agreement", name: "Generate Agreement", description: "Draft a legal agreement", scopes: ["contracts:write"], requiresApproval: false, industry: "legal", mockDelay: 2500 },
  { id: "request_esign", name: "Request E-Signature", description: "Send document for signature", scopes: ["esign:send"], requiresApproval: true, industry: "legal", mockDelay: 2000 },
  { id: "audit_trail", name: "View Audit Trail", description: "Access compliance audit log", scopes: ["audit:read"], requiresApproval: false, industry: "legal", mockDelay: 800 },
  // DevOps
  { id: "list_repos", name: "List Repositories", description: "List user's repositories", scopes: ["repos:read"], requiresApproval: false, industry: "devops", mockDelay: 800 },
  { id: "trigger_deploy", name: "Trigger Deploy", description: "Trigger a deployment pipeline", scopes: ["deploy:execute"], requiresApproval: true, industry: "devops", mockDelay: 2000 },
  { id: "check_monitoring", name: "Check Monitoring", description: "View system health metrics", scopes: ["monitoring:read"], requiresApproval: false, industry: "devops", mockDelay: 600 },
  { id: "create_incident", name: "Create Incident", description: "Open an incident ticket", scopes: ["incidents:write"], requiresApproval: true, industry: "devops", mockDelay: 1000 },
  { id: "rollback_deploy", name: "Rollback Deploy", description: "Roll back a deployment", scopes: ["deploy:rollback"], requiresApproval: true, industry: "devops", mockDelay: 2500 },
  // Retail
  { id: "search_inventory", name: "Search Inventory", description: "Search product inventory", scopes: ["inventory:read"], requiresApproval: false, industry: "retail", mockDelay: 800 },
  { id: "process_order", name: "Process Order", description: "Process a customer order", scopes: ["orders:write", "payments:charge"], requiresApproval: true, industry: "retail", mockDelay: 2000 },
  { id: "handle_return", name: "Handle Return", description: "Process a product return", scopes: ["returns:write", "refunds:process"], requiresApproval: true, industry: "retail", mockDelay: 1500 },
  { id: "update_pricing", name: "Update Pricing", description: "Modify product pricing", scopes: ["pricing:write"], requiresApproval: true, industry: "retail", mockDelay: 1000 },
  // Communication
  { id: "read_calendar", name: "Read Calendar", description: "Read user's calendar events", scopes: ["calendar:read"], requiresApproval: false, industry: "communication", mockDelay: 1000 },
  { id: "schedule_meeting", name: "Schedule Meeting", description: "Create a calendar event", scopes: ["calendar:write"], requiresApproval: true, industry: "communication", mockDelay: 1500 },
  { id: "draft_email", name: "Draft Email", description: "Draft an email for review", scopes: ["email:draft"], requiresApproval: false, industry: "communication", mockDelay: 1200 },
  { id: "send_email", name: "Send Email", description: "Send an email on user's behalf", scopes: ["email:send"], requiresApproval: true, industry: "communication", mockDelay: 1800 },
  { id: "search_contacts", name: "Search Contacts", description: "Search user's contacts", scopes: ["contacts:read"], requiresApproval: false, industry: "communication", mockDelay: 800 },
  // Generic
  { id: "read_data", name: "Read Data", description: "Read from a data source", scopes: ["data:read"], requiresApproval: false, industry: "custom", mockDelay: 800 },
  { id: "write_data", name: "Write Data", description: "Write to a data source", scopes: ["data:write"], requiresApproval: true, industry: "custom", mockDelay: 1200 },
  { id: "execute_action", name: "Execute Action", description: "Execute a custom action", scopes: ["actions:execute"], requiresApproval: true, industry: "custom", mockDelay: 1500 },
  { id: "query_api", name: "Query API", description: "Query an external API", scopes: ["api:read"], requiresApproval: false, industry: "custom", mockDelay: 1000 },
];

const AUTH0_FEATURE_LIBRARY = [
  { id: "token-vault", name: "Token Vault", description: "Securely delegates access to provider APIs without exposing user credentials to the AI.", icon: "Shield" },
  { id: "async-auth", name: "Async Authorization", description: "Human-in-the-loop approval for sensitive actions.", icon: "UserCheck" },
  { id: "fga", name: "Fine-Grained Authorization", description: "Granular, scoped permissions control what the agent can do.", icon: "Key" },
  { id: "consent", name: "Explicit Consent", description: "User must approve before agent acts on their behalf.", icon: "UserCheck" },
  { id: "delegation", name: "Delegated Access", description: "Agent acts on behalf of user with scoped, time-limited tokens.", icon: "ArrowRightLeft" },
  { id: "scoped-access", name: "Scoped Tool Access", description: "Token scopes determine which tools the agent can use.", icon: "Lock" },
  { id: "audit", name: "Audit Trail", description: "Every agent action logged with identity context for compliance.", icon: "FileText" },
  { id: "identity-context", name: "Identity Context", description: "Agent uses identity data to personalize without accessing raw PII.", icon: "User" },
  { id: "token-exchange", name: "Token Exchange", description: "MCP-style token exchange between agent and tools.", icon: "ArrowRightLeft" },
];

async function fetchLogo(url: string): Promise<{ logoUrl?: string; companyName?: string }> {
  try {
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;

    // Try to get the favicon and company name from the website
    const resp = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DemoBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) return {};

    const html = await resp.text();

    // Extract company name from title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const rawTitle = titleMatch?.[1]?.trim() || "";
    const companyName = rawTitle.split(/[|\-–—]/)[0].trim().substring(0, 60) || undefined;

    // Try multiple logo strategies in order of quality
    const origin = new URL(normalized).origin;

    // 1. Look for og:image
    const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    
    // 2. Look for apple-touch-icon (high quality)
    const appleTouchMatch = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);

    // 3. Look for logo in img tags with "logo" in src or alt
    const logoImgMatch = html.match(/<img[^>]+(?:src=["']([^"']*logo[^"']*)["']|alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["'])/i);

    // 4. Try clearbit logo API as fallback
    const domain = new URL(normalized).hostname.replace("www.", "");

    let logoUrl: string | undefined;

    if (appleTouchMatch?.[1]) {
      const href = appleTouchMatch[1];
      logoUrl = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
    } else if (ogImageMatch?.[1]) {
      const href = ogImageMatch[1];
      logoUrl = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
    } else if (logoImgMatch?.[1] || logoImgMatch?.[2]) {
      const href = (logoImgMatch[1] || logoImgMatch[2]).trim();
      logoUrl = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
    } else {
      // Fallback: clearbit logo API
      logoUrl = `https://logo.clearbit.com/${domain}`;
    }

    return { logoUrl, companyName };
  } catch (e) {
    console.warn("Logo fetch error:", e);
    // Return clearbit as last resort
    try {
      const domain = new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace("www.", "");
      return { logoUrl: `https://logo.clearbit.com/${domain}` };
    } catch {
      return {};
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "fetch_logo") {
      const result = await fetchLogo(body.url);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_config") {
      const { prompt, websiteUrl, customerName } = body;
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const systemPrompt = `You are an expert Auth0 solutions engineer who creates AI agent demo configurations.

Given a user's description of the demo they want, you must select the most relevant tools and Auth0 features from the provided library, then generate a complete demo configuration as valid JSON.

AVAILABLE TOOLS (pick 3-6 most relevant):
${JSON.stringify(TOOL_LIBRARY.map(t => ({ id: t.id, name: t.name, description: t.description, scopes: t.scopes, requiresApproval: t.requiresApproval, mockDelay: t.mockDelay })), null, 2)}

AVAILABLE AUTH0 FEATURES (pick 2-4 most relevant):
${JSON.stringify(AUTH0_FEATURE_LIBRARY.map(f => ({ id: f.id, name: f.name, description: f.description, icon: f.icon })), null, 2)}

You MUST return valid JSON only with this exact structure:
{
  "name": "Demo name (short, 3-5 words)",
  "description": "One sentence describing what this AI agent does",
  "color": "A single HSL color string like hsl(262 83% 58%) that fits the industry/brand",
  "customerName": "Customer or company name if identifiable, else null",
  "tools": [/* Array of selected tools from library - copy exact objects */],
  "auth0Features": [/* Array of selected features from library - copy exact objects, but update description to be specific to this use case */],
  "systemPromptParts": [
    "You are a [role]. [Main purpose].",
    "[Key behavior rule 1]",
    "[Key behavior rule 2 - about which actions need approval]"
  ],
  "knowledgePack": "2-3 sentences explaining which Auth0 features are used and why they matter for this specific use case."
}

Return ONLY the JSON object. No markdown, no explanation.`;

      const userMessage = `Create a demo configuration for: "${prompt}"${websiteUrl ? `\nCustomer website: ${websiteUrl}` : ""}${customerName ? `\nCompany name: ${customerName}` : ""}`;

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
            { role: "user", content: userMessage },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
        if (response.status === 402) throw new Error("AI credits exhausted.");
        throw new Error(`AI error: ${errText}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || "";

      // Strip markdown code blocks if present
      const jsonStr = rawContent
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      let config: any;
      try {
        config = JSON.parse(jsonStr);
      } catch (e) {
        console.error("JSON parse error, raw:", rawContent);
        throw new Error("AI returned invalid JSON. Please try again.");
      }

      // Validate required fields
      if (!config.name || !config.tools || !config.auth0Features) {
        throw new Error("Incomplete config from AI. Please try again.");
      }

      return new Response(JSON.stringify({ config }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-demo-generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
