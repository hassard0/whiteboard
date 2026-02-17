export interface DemoTool {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  requiresApproval: boolean;
  mockDelay?: number;
}

export interface Auth0Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tools: DemoTool[];
  auth0Features: Auth0Feature[];
  systemPromptParts: string[];
  knowledgePack: string;
}

export const DEMO_TEMPLATES: DemoTemplate[] = [
  {
    id: "travel-agent",
    name: "AI Travel Agent",
    description: "Books flights & hotels, shows delegated access and approval gates for purchases.",
    icon: "Plane",
    color: "hsl(18 95% 54%)",
    tools: [
      { id: "search_flights", name: "Search Flights", description: "Search available flights", scopes: ["flights:read"], requiresApproval: false, mockDelay: 1500 },
      { id: "book_flight", name: "Book Flight", description: "Book a flight on behalf of user", scopes: ["flights:write", "payments:charge"], requiresApproval: true, mockDelay: 2000 },
      { id: "search_hotels", name: "Search Hotels", description: "Search available hotels", scopes: ["hotels:read"], requiresApproval: false, mockDelay: 1200 },
      { id: "book_hotel", name: "Book Hotel", description: "Book a hotel on behalf of user", scopes: ["hotels:write", "payments:charge"], requiresApproval: true, mockDelay: 2000 },
      { id: "get_itinerary", name: "Get Itinerary", description: "Retrieve user's travel itinerary", scopes: ["itinerary:read"], requiresApproval: false, mockDelay: 800 },
    ],
    auth0Features: [
      { id: "token-vault", name: "Token Vault", description: "Securely delegates access to travel provider APIs without exposing user credentials to the AI.", icon: "Shield" },
      { id: "async-auth", name: "Async Authorization", description: "Human-in-the-loop approval for booking actions that incur charges.", icon: "UserCheck" },
      { id: "fga", name: "Fine-Grained Authorization", description: "Scoped permissions control which travel actions the agent can perform.", icon: "Key" },
    ],
    systemPromptParts: [
      "You are an AI Travel Agent. Help users plan and book travel.",
      "Always search before booking. Present options clearly with prices.",
      "Booking actions require user approval — explain why before requesting.",
    ],
    knowledgePack: "This demo uses Auth0 Token Vault to securely delegate access to travel provider APIs (airlines, hotels). The AI agent never sees the user's payment credentials. When the agent wants to book, it triggers an Async Authorization flow — the user must explicitly approve the purchase. Fine-Grained Authorization (FGA) controls which actions the agent can perform based on scoped permissions in the user's token.",
  },
  {
    id: "exec-assistant",
    name: "AI Executive Assistant",
    description: "Sends emails, schedules meetings — shows consent and Token Vault delegation.",
    icon: "Briefcase",
    color: "hsl(174 62% 47%)",
    tools: [
      { id: "read_calendar", name: "Read Calendar", description: "Read user's calendar events", scopes: ["calendar:read"], requiresApproval: false, mockDelay: 1000 },
      { id: "schedule_meeting", name: "Schedule Meeting", description: "Create a calendar event", scopes: ["calendar:write"], requiresApproval: true, mockDelay: 1500 },
      { id: "draft_email", name: "Draft Email", description: "Draft an email for review", scopes: ["email:draft"], requiresApproval: false, mockDelay: 1200 },
      { id: "send_email", name: "Send Email", description: "Send an email on user's behalf", scopes: ["email:send"], requiresApproval: true, mockDelay: 1800 },
      { id: "search_contacts", name: "Search Contacts", description: "Search user's contacts", scopes: ["contacts:read"], requiresApproval: false, mockDelay: 800 },
    ],
    auth0Features: [
      { id: "token-vault", name: "Token Vault", description: "Delegates access to email and calendar providers without exposing OAuth tokens.", icon: "Shield" },
      { id: "consent", name: "Explicit Consent", description: "User must approve before the agent sends emails or creates events.", icon: "UserCheck" },
      { id: "delegation", name: "Delegated Access", description: "The agent acts on behalf of the user with scoped, time-limited tokens.", icon: "ArrowRightLeft" },
    ],
    systemPromptParts: [
      "You are an AI Executive Assistant. Help users manage their schedule and communications.",
      "Draft emails before sending. Always confirm meeting details before scheduling.",
      "Sending emails and creating events require explicit user consent.",
    ],
    knowledgePack: "This demo shows how Auth0 enables an AI assistant to act on behalf of a user with delegated access. Token Vault securely stores and exchanges OAuth tokens for email and calendar providers. The agent never directly accesses the user's credentials. Every action that modifies data (sending email, creating events) requires explicit consent through Auth0's Async Authorization pattern.",
  },
  {
    id: "personal-shopper",
    name: "AI Personal Shopper",
    description: "Browses catalogs, places orders — shows fine-grained authorization.",
    icon: "ShoppingBag",
    color: "hsl(262 60% 55%)",
    tools: [
      { id: "search_products", name: "Search Products", description: "Search product catalog", scopes: ["catalog:read"], requiresApproval: false, mockDelay: 1000 },
      { id: "get_recommendations", name: "Get Recommendations", description: "Get personalized recommendations", scopes: ["catalog:read", "profile:read"], requiresApproval: false, mockDelay: 1500 },
      { id: "add_to_cart", name: "Add to Cart", description: "Add item to shopping cart", scopes: ["cart:write"], requiresApproval: false, mockDelay: 500 },
      { id: "place_order", name: "Place Order", description: "Place an order and charge payment", scopes: ["orders:write", "payments:charge"], requiresApproval: true, mockDelay: 2500 },
      { id: "track_order", name: "Track Order", description: "Track existing order status", scopes: ["orders:read"], requiresApproval: false, mockDelay: 800 },
    ],
    auth0Features: [
      { id: "fga", name: "Fine-Grained Authorization", description: "Granular permissions control what the shopper agent can access and do.", icon: "Key" },
      { id: "async-auth", name: "Async Authorization", description: "Purchase approval gates prevent unauthorized spending.", icon: "UserCheck" },
      { id: "identity-context", name: "Identity Context", description: "Agent uses identity data to personalize recommendations without accessing raw PII.", icon: "User" },
    ],
    systemPromptParts: [
      "You are an AI Personal Shopper. Help users discover products and make purchases.",
      "Provide personalized recommendations based on preferences.",
      "Adding to cart is allowed, but placing orders requires user approval.",
    ],
    knowledgePack: "This demo showcases Auth0's Fine-Grained Authorization (FGA) for AI agents. The shopper agent has granular permissions — it can browse and recommend freely, but purchasing requires explicit approval. Identity context from Auth0 enables personalization without exposing raw PII to the agent. The FGA model ensures the agent can only perform actions within its authorized scope.",
  },
  {
    id: "dev-copilot",
    name: "AI Developer Copilot",
    description: "Manages commits, deploys, documentation — shows scoped tool access.",
    icon: "Code",
    color: "hsl(142 60% 45%)",
    tools: [
      { id: "list_repos", name: "List Repositories", description: "List user's repositories", scopes: ["repos:read"], requiresApproval: false, mockDelay: 800 },
      { id: "create_commit", name: "Create Commit", description: "Create a commit in a repository", scopes: ["repos:write"], requiresApproval: true, mockDelay: 1500 },
      { id: "trigger_deploy", name: "Trigger Deploy", description: "Trigger a deployment pipeline", scopes: ["deploy:execute"], requiresApproval: true, mockDelay: 2000 },
      { id: "generate_docs", name: "Generate Docs", description: "Generate documentation from code", scopes: ["docs:write"], requiresApproval: false, mockDelay: 2500 },
      { id: "review_pr", name: "Review PR", description: "Review a pull request", scopes: ["repos:read", "reviews:write"], requiresApproval: false, mockDelay: 1800 },
    ],
    auth0Features: [
      { id: "scoped-access", name: "Scoped Tool Access", description: "Token scopes determine which dev tools the agent can use.", icon: "Lock" },
      { id: "token-vault", name: "Token Vault", description: "Secure delegation to GitHub/GitLab without exposing personal access tokens.", icon: "Shield" },
      { id: "audit", name: "Audit Trail", description: "Every agent action is logged with identity context for compliance.", icon: "FileText" },
    ],
    systemPromptParts: [
      "You are an AI Developer Copilot. Help developers with commits, deployments, and documentation.",
      "Review code before committing. Explain deployment implications.",
      "Creating commits and triggering deploys require explicit approval.",
    ],
    knowledgePack: "This demo shows how Auth0 secures AI agents in developer workflows. Token scopes define exactly which tools the copilot can use — read-only access to repos, but write access requires approval. Token Vault delegates access to source control providers (GitHub, GitLab) without exposing personal access tokens. Every action is logged with full identity context for audit compliance.",
  },
  {
    id: "generic-agent",
    name: "Generic Tool Agent",
    description: "Configurable tools — shows raw auth patterns and authorization mechanics.",
    icon: "Wrench",
    color: "hsl(45 90% 55%)",
    tools: [
      { id: "tool_a", name: "Read Data", description: "Read from a data source", scopes: ["data:read"], requiresApproval: false, mockDelay: 800 },
      { id: "tool_b", name: "Write Data", description: "Write to a data source", scopes: ["data:write"], requiresApproval: true, mockDelay: 1200 },
      { id: "tool_c", name: "Execute Action", description: "Execute a custom action", scopes: ["actions:execute"], requiresApproval: true, mockDelay: 1500 },
      { id: "tool_d", name: "Query API", description: "Query an external API", scopes: ["api:read"], requiresApproval: false, mockDelay: 1000 },
    ],
    auth0Features: [
      { id: "token-exchange", name: "Token Exchange", description: "MCP-style token exchange between agent and tools.", icon: "ArrowRightLeft" },
      { id: "fga", name: "Fine-Grained Authorization", description: "Granular permission checks on every tool call.", icon: "Key" },
      { id: "async-auth", name: "Async Authorization", description: "Human-in-the-loop for protected actions.", icon: "UserCheck" },
    ],
    systemPromptParts: [
      "You are a configurable AI agent demonstrating Auth0 authorization patterns.",
      "Show how identity controls AI behavior at every level.",
      "Protected actions require approval. Explain what Auth0 does at each step.",
    ],
    knowledgePack: "This is a generic demo showing raw Auth0 authorization mechanics for AI agents. It demonstrates MCP-style token exchange, Fine-Grained Authorization checks on every tool call, and Async Authorization for human-in-the-loop approval. Use this template to understand the foundational patterns that all other demos build upon.",
  },
];

export function getTemplateById(id: string): DemoTemplate | undefined {
  return DEMO_TEMPLATES.find((t) => t.id === id);
}

export function generateEnvId(auth0Sub: string, templateId: string): string {
  // Simple hash for demo purposes
  const str = `${auth0Sub}:${templateId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
