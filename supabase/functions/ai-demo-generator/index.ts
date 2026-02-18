import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOL_LIBRARY = [
  // Travel
  { id: "search_flights", name: "Search Flights", description: "Search available flights by route and date", scopes: ["flights:read"], requiresApproval: false, industry: "travel", mockDelay: 1500 },
  { id: "book_flight", name: "Book Flight", description: "Book a flight on behalf of user", scopes: ["flights:write", "payments:charge"], requiresApproval: true, industry: "travel", mockDelay: 2000 },
  { id: "search_hotels", name: "Search Hotels", description: "Search available hotels by location and dates", scopes: ["hotels:read"], requiresApproval: false, industry: "travel", mockDelay: 1200 },
  { id: "book_hotel", name: "Book Hotel", description: "Book a hotel on behalf of user", scopes: ["hotels:write", "payments:charge"], requiresApproval: true, industry: "travel", mockDelay: 2000 },
  { id: "get_itinerary", name: "Get Itinerary", description: "Retrieve user's travel itinerary", scopes: ["itinerary:read"], requiresApproval: false, industry: "travel", mockDelay: 800 },
  { id: "manage_loyalty", name: "Manage Loyalty Points", description: "View and redeem travel loyalty points", scopes: ["loyalty:read", "loyalty:redeem"], requiresApproval: true, industry: "travel", mockDelay: 1000 },
  // Healthcare
  { id: "access_patient_records", name: "Access Patient Records", description: "View patient medical records (HIPAA-scoped)", scopes: ["records:read", "hipaa:compliant"], requiresApproval: false, industry: "healthcare", mockDelay: 1000 },
  { id: "order_prescription", name: "Order Prescription", description: "Submit a prescription order for pharmacist review", scopes: ["rx:write", "clinical:approve"], requiresApproval: true, industry: "healthcare", mockDelay: 2000 },
  { id: "schedule_appointment", name: "Schedule Appointment", description: "Book a patient appointment with a provider", scopes: ["calendar:write"], requiresApproval: true, industry: "healthcare", mockDelay: 1500 },
  { id: "check_insurance", name: "Check Insurance Coverage", description: "Verify insurance eligibility and benefits", scopes: ["insurance:read"], requiresApproval: false, industry: "healthcare", mockDelay: 1200 },
  { id: "request_lab_results", name: "Request Lab Results", description: "Retrieve lab test results for a patient", scopes: ["labs:read"], requiresApproval: false, industry: "healthcare", mockDelay: 800 },
  { id: "send_clinical_note", name: "Send Clinical Note", description: "Submit a clinical note for physician sign-off", scopes: ["notes:write", "clinical:approve"], requiresApproval: true, industry: "healthcare", mockDelay: 1500 },
  // Fintech
  { id: "check_balance", name: "Check Balance", description: "View account balance and available funds", scopes: ["accounts:read"], requiresApproval: false, industry: "fintech", mockDelay: 500 },
  { id: "transfer_funds", name: "Transfer Funds", description: "Transfer money between accounts", scopes: ["accounts:write", "payments:transfer"], requiresApproval: true, industry: "fintech", mockDelay: 2500 },
  { id: "view_transactions", name: "View Transactions", description: "List recent transactions with filters", scopes: ["transactions:read"], requiresApproval: false, industry: "fintech", mockDelay: 800 },
  { id: "approve_wire", name: "Approve Wire Transfer", description: "Approve a high-value wire transfer", scopes: ["wire:approve", "compliance:check"], requiresApproval: true, industry: "fintech", mockDelay: 3000 },
  { id: "view_portfolio", name: "View Portfolio", description: "View investment portfolio and positions", scopes: ["portfolio:read"], requiresApproval: false, industry: "fintech", mockDelay: 1000 },
  { id: "execute_trade", name: "Execute Trade", description: "Place a buy or sell order for securities", scopes: ["trading:execute", "compliance:check"], requiresApproval: true, industry: "fintech", mockDelay: 2000 },
  { id: "generate_report", name: "Generate Report", description: "Generate a financial summary or compliance report", scopes: ["reports:write"], requiresApproval: false, industry: "fintech", mockDelay: 2000 },
  // HR
  { id: "search_employees", name: "Search Employees", description: "Search the employee directory by name, department, or role", scopes: ["employees:read"], requiresApproval: false, industry: "hr", mockDelay: 800 },
  { id: "approve_timeoff", name: "Approve Time Off", description: "Review and approve an employee time-off request", scopes: ["timeoff:approve"], requiresApproval: true, industry: "hr", mockDelay: 1500 },
  { id: "update_benefits", name: "Update Benefits", description: "Modify an employee's benefits enrollment", scopes: ["benefits:write"], requiresApproval: true, industry: "hr", mockDelay: 1200 },
  { id: "generate_offer_letter", name: "Generate Offer Letter", description: "Create a formal employment offer letter", scopes: ["offers:write", "hr:admin"], requiresApproval: true, industry: "hr", mockDelay: 2000 },
  { id: "run_payroll_check", name: "Run Payroll Check", description: "Validate payroll calculations before processing", scopes: ["payroll:read", "compliance:check"], requiresApproval: true, industry: "hr", mockDelay: 2500 },
  { id: "check_compliance", name: "Check HR Compliance", description: "Verify HR compliance status and deadlines", scopes: ["compliance:read"], requiresApproval: false, industry: "hr", mockDelay: 1000 },
  // Legal
  { id: "search_contracts", name: "Search Contracts", description: "Search the contract database by party, date, or type", scopes: ["contracts:read"], requiresApproval: false, industry: "legal", mockDelay: 1000 },
  { id: "generate_agreement", name: "Generate Agreement", description: "Draft a legal agreement from templates", scopes: ["contracts:write"], requiresApproval: false, industry: "legal", mockDelay: 2500 },
  { id: "request_esign", name: "Request E-Signature", description: "Send a document for counter-party e-signature", scopes: ["esign:send"], requiresApproval: true, industry: "legal", mockDelay: 2000 },
  { id: "audit_trail", name: "View Audit Trail", description: "Access the compliance and action audit log", scopes: ["audit:read"], requiresApproval: false, industry: "legal", mockDelay: 800 },
  { id: "file_document", name: "File Document", description: "File a legal document with a court or registry", scopes: ["filing:write", "legal:admin"], requiresApproval: true, industry: "legal", mockDelay: 3000 },
  // DevOps
  { id: "list_repos", name: "List Repositories", description: "List code repositories the user has access to", scopes: ["repos:read"], requiresApproval: false, industry: "devops", mockDelay: 800 },
  { id: "trigger_deploy", name: "Trigger Deployment", description: "Trigger a CI/CD pipeline deployment", scopes: ["deploy:execute"], requiresApproval: true, industry: "devops", mockDelay: 2000 },
  { id: "check_monitoring", name: "Check System Health", description: "View infrastructure health metrics and alerts", scopes: ["monitoring:read"], requiresApproval: false, industry: "devops", mockDelay: 600 },
  { id: "create_incident", name: "Create Incident", description: "Open a P1/P2 incident and notify on-call team", scopes: ["incidents:write"], requiresApproval: true, industry: "devops", mockDelay: 1000 },
  { id: "rollback_deploy", name: "Rollback Deployment", description: "Roll back to a previous stable deployment", scopes: ["deploy:rollback"], requiresApproval: true, industry: "devops", mockDelay: 2500 },
  // Retail
  { id: "search_inventory", name: "Search Inventory", description: "Search product catalog and stock availability", scopes: ["inventory:read"], requiresApproval: false, industry: "retail", mockDelay: 800 },
  { id: "process_order", name: "Process Order", description: "Process a customer purchase order with payment", scopes: ["orders:write", "payments:charge"], requiresApproval: true, industry: "retail", mockDelay: 2000 },
  { id: "handle_return", name: "Handle Return", description: "Process a product return and issue a refund", scopes: ["returns:write", "refunds:process"], requiresApproval: true, industry: "retail", mockDelay: 1500 },
  { id: "update_pricing", name: "Update Pricing", description: "Modify product pricing across the catalog", scopes: ["pricing:write"], requiresApproval: true, industry: "retail", mockDelay: 1000 },
  { id: "view_order_history", name: "View Order History", description: "View a customer's purchase history", scopes: ["orders:read"], requiresApproval: false, industry: "retail", mockDelay: 800 },
  // Insurance
  { id: "get_policy", name: "Get Policy Details", description: "Retrieve an insurance policy and coverage details", scopes: ["policies:read"], requiresApproval: false, industry: "insurance", mockDelay: 1000 },
  { id: "file_claim", name: "File Claim", description: "Submit a new insurance claim with documentation", scopes: ["claims:write"], requiresApproval: true, industry: "insurance", mockDelay: 2000 },
  { id: "check_claim_status", name: "Check Claim Status", description: "Query the current status of an open claim", scopes: ["claims:read"], requiresApproval: false, industry: "insurance", mockDelay: 800 },
  { id: "update_coverage", name: "Update Coverage", description: "Modify an insurance policy's coverage terms", scopes: ["policies:write", "underwriting:approve"], requiresApproval: true, industry: "insurance", mockDelay: 2500 },
  // Real Estate
  { id: "search_listings", name: "Search Listings", description: "Search property listings by location, price, and criteria", scopes: ["listings:read"], requiresApproval: false, industry: "realestate", mockDelay: 1200 },
  { id: "schedule_showing", name: "Schedule Showing", description: "Book a property viewing appointment", scopes: ["calendar:write", "listings:read"], requiresApproval: true, industry: "realestate", mockDelay: 1500 },
  { id: "submit_offer", name: "Submit Offer", description: "Submit a purchase offer on a property", scopes: ["offers:write", "legal:sign"], requiresApproval: true, industry: "realestate", mockDelay: 3000 },
  // Communication
  { id: "read_calendar", name: "Read Calendar", description: "Read the user's calendar events and availability", scopes: ["calendar:read"], requiresApproval: false, industry: "communication", mockDelay: 1000 },
  { id: "schedule_meeting", name: "Schedule Meeting", description: "Create a calendar event with attendees", scopes: ["calendar:write"], requiresApproval: true, industry: "communication", mockDelay: 1500 },
  { id: "draft_email", name: "Draft Email", description: "Compose an email draft for user review before sending", scopes: ["email:draft"], requiresApproval: false, industry: "communication", mockDelay: 1200 },
  { id: "send_email", name: "Send Email", description: "Send an email on the user's behalf", scopes: ["email:send"], requiresApproval: true, industry: "communication", mockDelay: 1800 },
  { id: "search_contacts", name: "Search Contacts", description: "Search the user's contact directory", scopes: ["contacts:read"], requiresApproval: false, industry: "communication", mockDelay: 800 },
  // Generic
  { id: "read_data", name: "Read Data", description: "Read records from a data source", scopes: ["data:read"], requiresApproval: false, industry: "custom", mockDelay: 800 },
  { id: "write_data", name: "Write Data", description: "Write or update records in a data source", scopes: ["data:write"], requiresApproval: true, industry: "custom", mockDelay: 1200 },
  { id: "execute_action", name: "Execute Action", description: "Execute a sensitive business action", scopes: ["actions:execute"], requiresApproval: true, industry: "custom", mockDelay: 1500 },
  { id: "query_api", name: "Query API", description: "Query an external third-party API", scopes: ["api:read"], requiresApproval: false, industry: "custom", mockDelay: 1000 },
];

const AUTH0_FEATURE_LIBRARY = [
  { id: "token-vault", name: "Token Vault", description: "Securely delegates access to provider APIs without exposing user credentials to the AI.", icon: "Shield" },
  { id: "async-auth", name: "Async Authorization", description: "Human-in-the-loop approval for sensitive actions before the agent proceeds.", icon: "UserCheck" },
  { id: "fga", name: "Fine-Grained Authorization", description: "Granular, relationship-based permissions that determine exactly what the agent can access.", icon: "Key" },
  { id: "consent", name: "Explicit Consent", description: "User must explicitly approve before the agent takes any action on their behalf.", icon: "UserCheck" },
  { id: "delegation", name: "Delegated Access", description: "Agent acts on behalf of the user with scoped, time-limited OAuth tokens.", icon: "ArrowRightLeft" },
  { id: "scoped-access", name: "Scoped Tool Access", description: "Token scopes enforce which tools the agent can invoke — no scope, no access.", icon: "Lock" },
  { id: "audit", name: "Audit Trail", description: "Every agent action is logged with full identity context for compliance and forensics.", icon: "FileText" },
  { id: "identity-context", name: "Identity Context", description: "The agent uses the user's identity claims to personalize responses without exposing raw PII.", icon: "User" },
  { id: "token-exchange", name: "Token Exchange", description: "RFC 8693 token exchange enables the agent to obtain narrowly-scoped downstream tokens.", icon: "ArrowRightLeft" },
  { id: "step-up-auth", name: "Step-Up Authentication", description: "High-risk operations require re-authentication or MFA before proceeding.", icon: "Shield" },
];

async function scrapeWithFirecrawl(url: string): Promise<{
  logoUrl?: string;
  companyName?: string;
  pageContext?: string;
}> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not set, falling back to raw fetch");
    return fallbackScrape(url);
  }

  try {
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;

    console.log("Scraping with Firecrawl:", normalized);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: normalized,
        formats: ["markdown", "html", "branding"],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Firecrawl scrape failed:", response.status, errText);
      return fallbackScrape(url);
    }

    const result = await response.json();
    const data = result.data || result;

    // Extract logo from branding first, then metadata
    let logoUrl: string | undefined;
    const branding = data.branding;
    if (branding?.images?.logo) {
      logoUrl = branding.images.logo;
    } else if (branding?.logo) {
      logoUrl = branding.logo;
    } else if (data.metadata?.ogImage) {
      logoUrl = data.metadata.ogImage;
    }

    // Also check favicon links in HTML as a logo source
    if (!logoUrl && data.html) {
      const appleTouchMatch = data.html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
      if (appleTouchMatch?.[1]) {
        const href = appleTouchMatch[1];
        const origin = new URL(normalized).origin;
        logoUrl = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
      }
    }

    // Try Google favicon service as it's more reliable than Clearbit
    if (!logoUrl) {
      const domain = new URL(normalized).hostname.replace("www.", "");
      // Try Clearbit first, but also store Google favicon as backup in the URL
      logoUrl = `https://logo.clearbit.com/${domain}`;
    }

    // Validate the logo URL is actually reachable (HEAD request, 3s timeout)
    if (logoUrl) {
      try {
        const check = await fetch(logoUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        if (!check.ok) {
          const domain = new URL(normalized).hostname.replace("www.", "");
          // Fall back to Google's favicon CDN which is highly reliable
          logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        }
      } catch {
        const domain = new URL(normalized).hostname.replace("www.", "");
        logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    }

    // Extract company name from branding/metadata
    const companyName = data.metadata?.["og:site_name"]
      || data.metadata?.siteName
      || cleanTitle(data.metadata?.title || "");

    // Build rich page context from markdown content (first 1500 chars is plenty)
    const markdownContent = data.markdown || "";
    const metaDesc = data.metadata?.description || data.metadata?.ogDescription || "";
    const pageContext = [metaDesc, markdownContent.substring(0, 1200)].filter(Boolean).join("\n\n").substring(0, 2000);

    console.log("Firecrawl result - company:", companyName, "logo:", logoUrl);

    return { logoUrl, companyName, pageContext };
  } catch (e) {
    console.warn("Firecrawl error:", e);
    return fallbackScrape(url);
  }
}

function cleanTitle(rawTitle: string): string {
  return rawTitle
    .split(/[|\-–—]/)[0]
    .trim()
    .replace(/\s*(Home|Official Site|Website|\.com|Corp|Inc|LLC|Ltd)$/i, "")
    .trim()
    .substring(0, 50);
}

async function fallbackScrape(url: string): Promise<{ logoUrl?: string; companyName?: string; pageContext?: string }> {
  try {
    let normalized = url.trim();
    if (!normalized.startsWith("http")) normalized = "https://" + normalized;
    const domain = new URL(normalized).hostname.replace("www.", "");
    const resp = await fetch(normalized, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "text/html" },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return { logoUrl: `https://logo.clearbit.com/${domain}` };
    const html = await resp.text();
    const origin = new URL(normalized).origin;

    // Company name
    const ogSiteNameMatch = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const companyName = ogSiteNameMatch?.[1]?.trim() || cleanTitle(titleMatch?.[1]?.trim() || "");

    // Logo
    let logoUrl: string | undefined;
    const appleTouchMatch = html.match(/<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i);
    if (appleTouchMatch?.[1]) {
      const href = appleTouchMatch[1];
      logoUrl = href.startsWith("http") ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
    } else {
      // Try Clearbit, validate it, fall back to Google favicon
      const clearbitUrl = `https://logo.clearbit.com/${domain}`;
      try {
        const check = await fetch(clearbitUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        logoUrl = check.ok ? clearbitUrl : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      } catch {
        logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    }

    // Context
    const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,300})["']/i);
    const headings: string[] = [];
    for (const m of html.matchAll(/<h[12][^>]*>([^<]{5,100})<\/h[12]>/gi)) headings.push(m[1].trim());
    const pageContext = [metaDescMatch?.[1] || "", headings.slice(0, 5).join(" | ")].filter(Boolean).join("\n").substring(0, 800);

    return { logoUrl, companyName, pageContext };
  } catch (e) {
    console.warn("Fallback scrape error:", e);
    try {
      const domain = new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace("www.", "");
      return { logoUrl: `https://logo.clearbit.com/${domain}` };
    } catch { return {}; }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "fetch_logo") {
      const result = await scrapeWithFirecrawl(body.url);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_config") {
      const { prompt, websiteUrl, customerName, pageContext } = body;
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const systemPrompt = `You are a senior Auth0 solutions engineer building realistic, customer-specific AI agent demos for enterprise sales presentations.

Your goal: create a config so specific to this company that a viewer watching the demo would INSTANTLY recognize it as built for them — not a generic template.

AVAILABLE TOOLS (only pick 4-6 that form one coherent workflow — NEVER mix unrelated industries):
${JSON.stringify(TOOL_LIBRARY.map(t => ({ id: t.id, name: t.name, description: t.description, scopes: t.scopes, requiresApproval: t.requiresApproval, mockDelay: t.mockDelay })), null, 2)}

AVAILABLE AUTH0 FEATURES (pick 2-4 that directly address this company's compliance/security pain points):
${JSON.stringify(AUTH0_FEATURE_LIBRARY.map(f => ({ id: f.id, name: f.name, description: f.description, icon: f.icon })), null, 2)}

STRICT RULES:
1. Tools MUST all logically belong to ONE workflow. e.g., a wealth management demo uses portfolio + trade tools, NOT travel or HR tools.
2. Rewrite EVERY tool description in this company's voice and context — no generic placeholder text.
3. Auth0 feature descriptions must reference the company's actual regulatory context (HIPAA, PCI-DSS, SOC2, GDPR, etc.).
4. systemPromptParts must read like a real production system prompt — not a template. Name the company, the specific user role, and concrete behavioral rules.
5. autopilotSteps must be a realistic guided demo script: each step sends a natural user message that triggers the agent to use one of the selected tools, and the explanation shows what Auth0 feature is protecting that action.
6. customerName must be the clean short brand name only (e.g. "Salesforce" not "Salesforce Inc. | CRM Software").
7. Brand color must reflect the company's actual visual identity when known.

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "name": "[Company] [Role] — short, e.g. 'Fidelity Wealth Advisor' or 'Kaiser Patient Concierge'",
  "description": "One precise sentence: who uses it, what it automates, for which company.",
  "color": "hsl(...) matching brand — e.g. hsl(214 100% 34%) for Salesforce blue",
  "customerName": "Short brand name only",
  "tools": [
    {
      "id": "<tool id from library>",
      "name": "<tool name>",
      "description": "<rewritten description specific to this company's context and user role>",
      "scopes": ["<scopes>"],
      "requiresApproval": true|false,
      "mockDelay": <number>
    }
  ],
  "auth0Features": [
    {
      "id": "<feature id>",
      "name": "<feature name>",
      "description": "<description rewritten to reference this company's specific compliance/security need>",
      "icon": "<icon name>"
    }
  ],
  "systemPromptParts": [
    "You are [specific role name] for [Company]. [1-2 sentences about core mission specific to their domain and user type.]",
    "[Rule: what data you can access without approval and why it's safe — reference specific data types for this company.]",
    "[Rule: which actions ALWAYS require human approval before execution and what the approval flow looks like.]",
    "[Rule: industry-specific behavioral constraint, e.g. compliance boundary, data privacy rule, or regulatory limit.]",
    "[Tone/persona rule: how the agent speaks, what it knows about the company, any company-specific terminology it uses.]"
  ],
  "knowledgePack": "2-3 sentences: exactly which Auth0 features solve this company's SPECIFIC pain points and why each one matters for their regulatory/security context.",
  "autopilotSteps": [
    {
      "label": "<short step label, e.g. 'Check Portfolio'>",
      "message": "<realistic user message that would naturally trigger this tool, phrased as the logged-in user would say it>",
      "explanation": "<what Auth0 is doing behind the scenes at this step — reference a specific feature and why it applies here>",
      "feature": "<Auth0 feature name being highlighted>"
    }
  ]
}

Generate 4-6 autopilotSteps that tell a coherent story: start with a read/lookup, escalate to a sensitive action requiring approval, show Auth0 blocking/gating it, then approval/completion.`;

      const userMessage = `Create a demo for: "${prompt}"${websiteUrl ? `\nCustomer website: ${websiteUrl}` : ""}${customerName ? `\nCompany: ${customerName}` : ""}${pageContext ? `\nWebsite content:\n${pageContext}` : ""}`;

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
            { role: "user", content: userMessage },
          ],
          temperature: 0.5,
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

      // Strip any markdown fences
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

      if (!config.name || !config.tools || !config.auth0Features) {
        throw new Error("Incomplete config from AI. Please try again.");
      }

      // Ensure autopilotSteps is always an array
      if (!Array.isArray(config.autopilotSteps)) config.autopilotSteps = [];

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
