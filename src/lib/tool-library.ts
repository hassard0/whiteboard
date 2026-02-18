// Shared tool and Auth0 feature library (mirrors the edge function)

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  scopes: string[];
  requiresApproval: boolean;
  mockDelay: number;
  industry: string;
}

export interface Auth0FeatureDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const TOOL_LIBRARY: ToolDef[] = [
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
  { id: "search_employees", name: "Search Employees", description: "Search the employee directory by name or department", scopes: ["employees:read"], requiresApproval: false, industry: "hr", mockDelay: 800 },
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
  // Communication / Productivity
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

export const AUTH0_FEATURE_LIBRARY: Auth0FeatureDef[] = [
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

export const INDUSTRY_GROUPS: Record<string, string> = {
  travel: "✈️ Travel",
  healthcare: "🏥 Healthcare",
  fintech: "💳 Fintech",
  hr: "👥 HR",
  legal: "⚖️ Legal",
  devops: "💻 DevOps",
  retail: "🛍️ Retail",
  insurance: "🛡️ Insurance",
  realestate: "🏠 Real Estate",
  communication: "📬 Communication",
  custom: "⚙️ Generic",
};
