import type { DemoTool, Auth0Feature } from "./demo-templates";

// ─── Industry presets ───
export interface IndustryPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  suggestedTools: string[];
  suggestedFeatures: string[];
  promptHint: string;
}

export const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: "travel",
    name: "Travel & Hospitality",
    description: "Flight booking, hotel reservations, itinerary management",
    icon: "Plane",
    color: "hsl(262 83% 58%)",
    suggestedTools: ["search_flights", "book_flight", "search_hotels", "book_hotel", "get_itinerary"],
    suggestedFeatures: ["token-vault", "async-auth", "fga"],
    promptHint: "You are an AI Travel Agent. Help users plan and book travel.",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Patient records, prescriptions, appointment scheduling",
    icon: "Heart",
    color: "hsl(350 70% 55%)",
    suggestedTools: ["access_patient_records", "order_prescription", "schedule_appointment", "check_insurance", "request_lab_results"],
    suggestedFeatures: ["fga", "consent", "audit", "token-vault"],
    promptHint: "You are a healthcare AI assistant. Help clinical staff manage patient care while respecting HIPAA compliance.",
  },
  {
    id: "fintech",
    name: "Financial Services",
    description: "Balance checks, fund transfers, transaction approvals",
    icon: "DollarSign",
    color: "hsl(142 60% 45%)",
    suggestedTools: ["check_balance", "transfer_funds", "view_transactions", "approve_wire", "generate_report"],
    suggestedFeatures: ["async-auth", "fga", "audit", "token-vault"],
    promptHint: "You are a financial AI assistant. Help users manage accounts while enforcing regulatory controls.",
  },
  {
    id: "retail",
    name: "Retail & E-Commerce",
    description: "Inventory, orders, returns, pricing",
    icon: "ShoppingCart",
    color: "hsl(262 60% 55%)",
    suggestedTools: ["search_inventory", "process_order", "handle_return", "update_pricing", "check_loyalty"],
    suggestedFeatures: ["fga", "async-auth", "identity-context"],
    promptHint: "You are a retail AI assistant. Help manage inventory, orders, and customer interactions.",
  },
  {
    id: "hr",
    name: "Human Resources",
    description: "Employee records, time-off, benefits, onboarding",
    icon: "Users",
    color: "hsl(200 70% 50%)",
    suggestedTools: ["search_employees", "approve_timeoff", "update_benefits", "generate_offer_letter", "check_compliance"],
    suggestedFeatures: ["fga", "consent", "delegation", "audit"],
    promptHint: "You are an HR AI assistant. Help manage employee operations with proper access controls.",
  },
  {
    id: "legal",
    name: "Legal & Compliance",
    description: "Contract search, agreement generation, e-signatures",
    icon: "Scale",
    color: "hsl(30 80% 55%)",
    suggestedTools: ["search_contracts", "generate_agreement", "request_esign", "check_compliance", "audit_trail"],
    suggestedFeatures: ["fga", "async-auth", "audit", "consent"],
    promptHint: "You are a legal AI assistant. Help manage contracts and compliance with proper authorization.",
  },
  {
    id: "devops",
    name: "DevOps & Platform",
    description: "Repos, deployments, monitoring, incidents",
    icon: "Terminal",
    color: "hsl(174 62% 47%)",
    suggestedTools: ["list_repos", "trigger_deploy", "check_monitoring", "create_incident", "rollback_deploy"],
    suggestedFeatures: ["scoped-access", "token-vault", "audit", "async-auth"],
    promptHint: "You are a DevOps AI copilot. Help engineers manage infrastructure with proper change controls.",
  },
  {
    id: "custom",
    name: "Custom / Blank",
    description: "Start from scratch with full flexibility",
    icon: "Sparkles",
    color: "hsl(45 90% 55%)",
    suggestedTools: [],
    suggestedFeatures: ["fga", "async-auth", "token-vault"],
    promptHint: "You are an AI agent demonstrating Auth0 authorization patterns.",
  },
];

// ─── Tool library ───
export interface ToolTemplate {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  requiresApproval: boolean;
  industry: string;
  mockDelay?: number;
}

export const TOOL_LIBRARY: ToolTemplate[] = [
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

  // Retail
  { id: "search_inventory", name: "Search Inventory", description: "Search product inventory", scopes: ["inventory:read"], requiresApproval: false, industry: "retail", mockDelay: 800 },
  { id: "process_order", name: "Process Order", description: "Process a customer order", scopes: ["orders:write", "payments:charge"], requiresApproval: true, industry: "retail", mockDelay: 2000 },
  { id: "handle_return", name: "Handle Return", description: "Process a product return", scopes: ["returns:write", "refunds:process"], requiresApproval: true, industry: "retail", mockDelay: 1500 },
  { id: "update_pricing", name: "Update Pricing", description: "Modify product pricing", scopes: ["pricing:write"], requiresApproval: true, industry: "retail", mockDelay: 1000 },
  { id: "check_loyalty", name: "Check Loyalty", description: "Check customer loyalty status", scopes: ["loyalty:read", "profile:read"], requiresApproval: false, industry: "retail", mockDelay: 600 },

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

  // Generic
  { id: "read_data", name: "Read Data", description: "Read from a data source", scopes: ["data:read"], requiresApproval: false, industry: "custom", mockDelay: 800 },
  { id: "write_data", name: "Write Data", description: "Write to a data source", scopes: ["data:write"], requiresApproval: true, industry: "custom", mockDelay: 1200 },
  { id: "execute_action", name: "Execute Action", description: "Execute a custom action", scopes: ["actions:execute"], requiresApproval: true, industry: "custom", mockDelay: 1500 },
  { id: "query_api", name: "Query API", description: "Query an external API", scopes: ["api:read"], requiresApproval: false, industry: "custom", mockDelay: 1000 },

  // Communication
  { id: "read_calendar", name: "Read Calendar", description: "Read user's calendar events", scopes: ["calendar:read"], requiresApproval: false, industry: "communication", mockDelay: 1000 },
  { id: "schedule_meeting", name: "Schedule Meeting", description: "Create a calendar event", scopes: ["calendar:write"], requiresApproval: true, industry: "communication", mockDelay: 1500 },
  { id: "draft_email", name: "Draft Email", description: "Draft an email for review", scopes: ["email:draft"], requiresApproval: false, industry: "communication", mockDelay: 1200 },
  { id: "send_email", name: "Send Email", description: "Send an email on user's behalf", scopes: ["email:send"], requiresApproval: true, industry: "communication", mockDelay: 1800 },
  { id: "search_contacts", name: "Search Contacts", description: "Search user's contacts", scopes: ["contacts:read"], requiresApproval: false, industry: "communication", mockDelay: 800 },

  // Shopping
  { id: "search_products", name: "Search Products", description: "Search product catalog", scopes: ["catalog:read"], requiresApproval: false, industry: "shopping", mockDelay: 1000 },
  { id: "get_recommendations", name: "Get Recommendations", description: "Get personalized recommendations", scopes: ["catalog:read", "profile:read"], requiresApproval: false, industry: "shopping", mockDelay: 1500 },
  { id: "add_to_cart", name: "Add to Cart", description: "Add item to shopping cart", scopes: ["cart:write"], requiresApproval: false, industry: "shopping", mockDelay: 500 },
  { id: "place_order", name: "Place Order", description: "Place an order and charge payment", scopes: ["orders:write", "payments:charge"], requiresApproval: true, industry: "shopping", mockDelay: 2500 },
  { id: "track_order", name: "Track Order", description: "Track existing order status", scopes: ["orders:read"], requiresApproval: false, industry: "shopping", mockDelay: 800 },
];

// ─── Auth0 Feature library ───
export const AUTH0_FEATURE_LIBRARY: Auth0Feature[] = [
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

export function getToolsByIndustry(industryId: string): ToolTemplate[] {
  return TOOL_LIBRARY.filter((t) => t.industry === industryId);
}

export function getToolById(id: string): ToolTemplate | undefined {
  return TOOL_LIBRARY.find((t) => t.id === id);
}