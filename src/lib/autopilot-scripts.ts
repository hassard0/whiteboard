export interface AutopilotStep {
  id: string;
  label: string;
  userMessage: string;
  explanation: string;
  highlightFeature?: string;
}

export interface AutopilotScript {
  templateId: string;
  title: string;
  description: string;
  steps: AutopilotStep[];
}

export const AUTOPILOT_SCRIPTS: Record<string, AutopilotScript> = {
  "travel-agent": {
    templateId: "travel-agent",
    title: "AI Travel Agent Walkthrough",
    description: "See how Auth0 secures an AI travel agent with delegated access, approval gates, and scoped permissions.",
    steps: [
      {
        id: "step-1",
        label: "Search Flights",
        userMessage: "Search for flights from New York to San Francisco next week",
        explanation: "The agent calls the Search Flights tool automatically. Auth0's Fine-Grained Authorization checks the token for `flights:read` scope — no approval needed for read operations.",
        highlightFeature: "Fine-Grained Authorization",
      },
      {
        id: "step-2",
        label: "Search Hotels",
        userMessage: "Also search for hotels in San Francisco for 3 nights",
        explanation: "Another read-only tool call. The agent uses `hotels:read` scope. Token Vault delegates access to the hotel provider API without exposing user credentials.",
        highlightFeature: "Token Vault",
      },
      {
        id: "step-3",
        label: "Book a Flight",
        userMessage: "Book the cheapest flight option",
        explanation: "This triggers an Approval Gate! The `book_flight` tool requires `flights:write` and `payments:charge` scopes. Auth0's Async Authorization pauses the agent and asks for explicit human consent before charging.",
        highlightFeature: "Async Authorization",
      },
      {
        id: "step-4",
        label: "Book a Hotel",
        userMessage: "Now book the Marriott hotel",
        explanation: "Another approval gate for a write operation. Notice how the agent explains what it wants to do before requesting approval — this is the human-in-the-loop pattern.",
        highlightFeature: "Async Authorization",
      },
      {
        id: "step-5",
        label: "View Itinerary",
        userMessage: "Show me my complete travel itinerary",
        explanation: "The agent retrieves the itinerary using `itinerary:read`. All actions have been logged to the audit trail with full identity context — who approved what, when, and why.",
        highlightFeature: "Fine-Grained Authorization",
      },
    ],
  },
  "exec-assistant": {
    templateId: "exec-assistant",
    title: "AI Executive Assistant Walkthrough",
    description: "See how Auth0 enables delegated access for an AI that manages your calendar and email.",
    steps: [
      {
        id: "step-1",
        label: "Check Calendar",
        userMessage: "What's on my calendar today?",
        explanation: "The agent reads your calendar using `calendar:read` scope. Token Vault securely exchanges tokens with the calendar provider — the AI never sees your OAuth credentials.",
        highlightFeature: "Token Vault",
      },
      {
        id: "step-2",
        label: "Find Contacts",
        userMessage: "Find Jane Smith's contact info",
        explanation: "The agent searches contacts with `contacts:read` scope. This is a read-only operation that's automatically authorized by the token's permission set.",
        highlightFeature: "Fine-Grained Authorization",
      },
      {
        id: "step-3",
        label: "Draft Email",
        userMessage: "Draft an email to Jane about the product review meeting",
        explanation: "Drafting uses `email:draft` scope — it doesn't send anything. The agent can prepare content safely. The distinction between draft and send scopes is key to least-privilege access.",
        highlightFeature: "Delegated Access",
      },
      {
        id: "step-4",
        label: "Send Email",
        userMessage: "Send that email to Jane",
        explanation: "Sending requires explicit consent! The `email:send` scope triggers Auth0's approval flow. Your credentials are never exposed — Token Vault handles the delegation.",
        highlightFeature: "Explicit Consent",
      },
      {
        id: "step-5",
        label: "Schedule Meeting",
        userMessage: "Schedule a 30-minute product review meeting with Jane tomorrow at 2 PM",
        explanation: "Creating calendar events requires `calendar:write` and triggers another approval gate. The agent can read freely but can never modify your schedule without consent.",
        highlightFeature: "Async Authorization",
      },
    ],
  },
  "personal-shopper": {
    templateId: "personal-shopper",
    title: "AI Personal Shopper Walkthrough",
    description: "See how Fine-Grained Authorization controls what an AI shopping agent can access and purchase.",
    steps: [
      {
        id: "step-1",
        label: "Browse Products",
        userMessage: "Show me wireless headphones",
        explanation: "The agent searches the catalog with `catalog:read` scope. No approval needed — browsing is a safe, read-only operation within the agent's permission boundary.",
        highlightFeature: "Fine-Grained Authorization",
      },
      {
        id: "step-2",
        label: "Get Recommendations",
        userMessage: "What would you recommend based on my preferences?",
        explanation: "The agent uses `catalog:read` + `profile:read` to personalize recommendations. Auth0's Identity Context provides preference data without exposing raw PII to the AI.",
        highlightFeature: "Identity Context",
      },
      {
        id: "step-3",
        label: "Add to Cart",
        userMessage: "Add the Premium Wireless Headphones to my cart",
        explanation: "Adding to cart uses `cart:write` — a low-risk write operation that doesn't involve payment. The FGA model allows this without approval since no money changes hands.",
        highlightFeature: "Fine-Grained Authorization",
      },
      {
        id: "step-4",
        label: "Place Order",
        userMessage: "Place the order",
        explanation: "Purchasing requires `orders:write` + `payments:charge` — this triggers the approval gate. The agent cannot spend your money without explicit consent.",
        highlightFeature: "Async Authorization",
      },
      {
        id: "step-5",
        label: "Track Order",
        userMessage: "Track my recent order",
        explanation: "Order tracking uses `orders:read` scope. The full transaction history is logged with identity context for audit compliance.",
        highlightFeature: "Fine-Grained Authorization",
      },
    ],
  },
  "dev-copilot": {
    templateId: "dev-copilot",
    title: "AI Developer Copilot Walkthrough",
    description: "See how scoped tool access and Token Vault secure an AI that manages code and deployments.",
    steps: [
      {
        id: "step-1",
        label: "List Repositories",
        userMessage: "Show me my repositories",
        explanation: "The agent lists repos using `repos:read` scope. Token Vault delegates access to GitHub/GitLab without exposing your personal access token to the AI.",
        highlightFeature: "Token Vault",
      },
      {
        id: "step-2",
        label: "Review PR",
        userMessage: "Review pull request #42",
        explanation: "PR review uses `repos:read` + `reviews:write`. Even though it writes a review, the risk profile is lower than code changes, so it's auto-authorized by the scoped token.",
        highlightFeature: "Scoped Tool Access",
      },
      {
        id: "step-3",
        label: "Generate Docs",
        userMessage: "Generate documentation for the auth0-ai-demo repo",
        explanation: "Doc generation uses `docs:write` scope. This is a safe write operation — it creates documentation but doesn't modify source code or trigger deployments.",
        highlightFeature: "Scoped Tool Access",
      },
      {
        id: "step-4",
        label: "Create Commit",
        userMessage: "Create a commit with the documentation changes",
        explanation: "Code changes require explicit approval! `repos:write` triggers the approval gate. Every commit by the AI agent is logged with full identity context for audit.",
        highlightFeature: "Audit Trail",
      },
      {
        id: "step-5",
        label: "Deploy",
        userMessage: "Deploy to staging",
        explanation: "Deployments require `deploy:execute` and explicit approval. This is the highest-risk operation — Auth0 ensures no AI agent can deploy without human authorization.",
        highlightFeature: "Async Authorization",
      },
    ],
  },
  "generic-agent": {
    templateId: "generic-agent",
    title: "Generic Agent Auth Patterns",
    description: "Explore the raw authorization mechanics that power all Auth0 AI agent integrations.",
    steps: [
      {
        id: "step-1",
        label: "Read Data",
        userMessage: "Read data from the data store",
        explanation: "The most basic pattern: `data:read` scope is checked against the token. If the scope is present, the tool executes automatically. This is Fine-Grained Authorization in action.",
        highlightFeature: "Fine-Grained Authorization",
      },
      {
        id: "step-2",
        label: "Query API",
        userMessage: "Query the external API for status",
        explanation: "External API calls use `api:read` scope. Token exchange (MCP-style) ensures the API receives a properly scoped, time-limited token — not the user's full credentials.",
        highlightFeature: "Token Exchange",
      },
      {
        id: "step-3",
        label: "Write Data",
        userMessage: "Write a new record to the data store",
        explanation: "Write operations require approval! `data:write` triggers the human-in-the-loop flow. This is Async Authorization — the agent pauses and waits for explicit consent.",
        highlightFeature: "Async Authorization",
      },
      {
        id: "step-4",
        label: "Execute Action",
        userMessage: "Execute the custom action",
        explanation: "Custom actions use `actions:execute` — the most privileged scope. Both FGA permission checks and human approval are required. This shows defense-in-depth.",
        highlightFeature: "Async Authorization",
      },
    ],
  },
};