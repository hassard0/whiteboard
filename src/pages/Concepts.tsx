import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Key, UserCheck, ArrowRightLeft, Lock, FileText, User,
  Plane, Briefcase, ShoppingBag, Code, Wrench, GitBranch, Cpu, Database, Globe, AlertTriangle, CheckCircle
} from "lucide-react";

// ─── Concept definitions ───
const CONCEPTS = [
  {
    id: "token-vault",
    name: "Token Vault",
    icon: Shield,
    color: "hsl(262 83% 58%)",
    tagline: "Secure credential delegation without exposure",
    summary: "Token Vault stores and exchanges OAuth/API credentials on behalf of users so AI agents never touch raw secrets. The agent requests a short-lived, scoped token — Token Vault validates identity and issues it.",
    howItWorks: [
      "User grants consent for the AI agent to act on their behalf",
      "Credentials are stored encrypted in Auth0 Token Vault",
      "Agent requests access — Token Vault validates identity & scope",
      "A time-limited, scoped token is issued to the agent",
      "Agent uses the token to call the third-party API",
      "Token expires automatically after the session",
    ],
    diagram: `graph LR
  A([👤 User]) -->|Grants consent| B[Auth0 Token Vault]
  B -->|Stores encrypted| C[(Credential Store)]
  D([🤖 AI Agent]) -->|Requests access| B
  B -->|Validates identity| E{Scope Check}
  E -->|✅ Authorized| F[Short-lived Token]
  F --> D
  D -->|Uses token| G[Third-Party API]
  G -->|Response| D
  style B fill:#6d28d9,color:#fff
  style E fill:#1e1b2e,color:#fff
  style F fill:#059669,color:#fff`,
    usedIn: ["AI Travel Agent", "AI Executive Assistant", "AI Developer Copilot"],
  },
  {
    id: "async-auth",
    name: "Async Authorization",
    icon: UserCheck,
    color: "hsl(174 62% 47%)",
    tagline: "Human-in-the-loop approval for sensitive actions",
    summary: "When an AI agent wants to perform a high-stakes action (book a flight, send an email, trigger a deploy), Async Authorization pauses the agent and requests explicit human approval before proceeding.",
    howItWorks: [
      "Agent identifies an action requiring approval (e.g. charge payment)",
      "Agent creates an approval request in Auth0",
      "User receives a notification / in-app prompt",
      "User reviews the action details and decides Approve or Deny",
      "Auth0 records the decision with full identity context",
      "Agent resumes or aborts based on the decision",
    ],
    diagram: `sequenceDiagram
  participant U as 👤 User
  participant A as 🤖 AI Agent
  participant AZ as Auth0
  participant API as External API

  A->>AZ: Request approval for sensitive action
  AZ->>U: Notify: action requires approval
  U->>AZ: Approve / Deny (with identity proof)
  AZ->>A: Decision + audit record
  alt Approved
    A->>API: Execute action
    API-->>A: Result
  else Denied
    A->>U: Action cancelled
  end`,
    usedIn: ["AI Travel Agent", "AI Personal Shopper", "Generic Tool Agent"],
  },
  {
    id: "fga",
    name: "Fine-Grained Authorization",
    icon: Key,
    color: "hsl(45 90% 55%)",
    tagline: "Granular permission enforcement on every action",
    summary: "Fine-Grained Authorization (FGA) lets you model complex permission relationships — not just role-based, but relationship-based. An AI agent can only call tools it's explicitly authorized to use, scoped to the right resources.",
    howItWorks: [
      "Permissions are modeled as relationships (user → resource → action)",
      "Agent's token contains scopes defining allowed operations",
      "Before every tool call, Auth0 FGA checks the permission",
      "If unauthorized, the tool call is blocked immediately",
      "Permissions can be scoped to specific resources (not just types)",
      "Changes to permissions take effect in real-time",
    ],
    diagram: `graph TD
  A([🤖 AI Agent]) -->|Calls tool| B{FGA Check}
  B -->|Query: can agent do X on resource Y?| C[(FGA Store)]
  C -->|User-agent relationship| D{Authorized?}
  D -->|✅ Yes| E[Tool Executes]
  D -->|❌ No| F[Blocked + Logged]
  G([👤 User]) -->|Grants permissions| C
  style B fill:#6d28d9,color:#fff
  style D fill:#1e1b2e,color:#fff
  style E fill:#059669,color:#fff
  style F fill:#dc2626,color:#fff`,
    usedIn: ["AI Personal Shopper", "AI Developer Copilot", "Generic Tool Agent"],
  },
  {
    id: "delegation",
    name: "Delegated Access",
    icon: ArrowRightLeft,
    color: "hsl(200 70% 50%)",
    tagline: "Agents act on behalf of users with bounded authority",
    summary: "Delegated Access allows an AI agent to act as a proxy for a user, inheriting a subset of their permissions. The agent never gets full user authority — it receives a narrowly-scoped, time-limited delegation.",
    howItWorks: [
      "User authenticates and grants delegation to the agent",
      "Auth0 issues a delegation token with restricted scopes",
      "Agent uses the delegation token — not the user's full token",
      "Delegated authority is bounded by what the user can grant",
      "Time-to-live is enforced — delegation expires automatically",
      "User can revoke delegation at any time",
    ],
    diagram: `graph LR
  A([👤 User]) -->|Full token| B[Auth0]
  A -->|Grants delegation| B
  B -->|Issues bounded token| C([🤖 AI Agent])
  C -->|Scoped delegation token| D[Service API]
  D -->|Acts as user within scope| E[(User Data)]
  A -->|Can revoke anytime| B
  style B fill:#6d28d9,color:#fff
  style C fill:#1e3a5f,color:#fff`,
    usedIn: ["AI Executive Assistant"],
  },
  {
    id: "audit",
    name: "Audit Trail",
    icon: FileText,
    color: "hsl(142 60% 45%)",
    tagline: "Every agent action logged with full identity context",
    summary: "Every tool call, approval decision, and API interaction is recorded with the full identity chain — who authorized the agent, what scopes were active, and what the agent did. This enables compliance, debugging, and accountability.",
    howItWorks: [
      "Agent makes a tool call with its identity token",
      "Auth0 intercepts and logs: user identity, agent identity, scopes, timestamp",
      "The action result (success/failure) is appended to the log",
      "Approval decisions include user identity and reasoning",
      "Logs are tamper-evident and stored with retention policies",
      "Audit trail is queryable for compliance reports",
    ],
    diagram: `graph LR
  A([🤖 AI Agent]) -->|Tool call + token| B[Auth0 Middleware]
  B -->|Extract identity context| C[Audit Logger]
  C -->|Structured event| D[(Audit Store)]
  B -->|Forward request| E[Tool / API]
  E -->|Result| B
  B -->|Append result| C
  F([👤 Compliance Team]) -->|Query| D
  style B fill:#6d28d9,color:#fff
  style C fill:#059669,color:#fff
  style D fill:#1e1b2e,color:#fff`,
    usedIn: ["AI Developer Copilot"],
  },
  {
    id: "identity-context",
    name: "Identity Context",
    icon: User,
    color: "hsl(280 70% 55%)",
    tagline: "Personalization without raw PII exposure",
    summary: "AI agents can be personalized using identity attributes from Auth0 — preferences, roles, location, tier — without the agent ever seeing raw PII. The agent receives structured, filtered identity context appropriate to its scope.",
    howItWorks: [
      "User profile is stored in Auth0 with structured attributes",
      "Agent requests identity context for its allowed scope",
      "Auth0 filters PII — returns only permitted attributes",
      "Agent uses context for personalization (recommendations, tone, etc.)",
      "Raw identifiers (email, SSN, etc.) are never passed to the agent",
      "Context changes (e.g. role change) are reflected in real-time",
    ],
    diagram: `graph LR
  A([🤖 AI Agent]) -->|Request: identity context for scope| B[Auth0]
  B -->|Filter by scope| C[(User Profile)]
  C -->|Full profile| B
  B -->|Filtered context only| A
  A -->|Personalizes response| D([👤 User])
  note1[No raw PII] -.->|❌ blocked| A
  style B fill:#6d28d9,color:#fff
  style note1 fill:#dc2626,color:#fff`,
    usedIn: ["AI Personal Shopper"],
  },
];

// ─── Demo flow diagrams ───
const DEMO_FLOWS = [
  {
    id: "travel-agent",
    name: "AI Travel Agent",
    icon: Plane,
    color: "hsl(262 83% 58%)",
    description: "Shows Token Vault, Async Authorization, and FGA working together for booking workflows.",
    diagram: `graph TD
  U([👤 User]) -->|Chat: Book me a flight to NYC| A([🤖 Travel Agent])
  A -->|search_flights - scopes: flights:read| B{FGA Check}
  B -->|✅ Allowed| C[Search Results]
  C --> A
  A -->|book_flight - requires approval| D{Async Auth}
  D -->|Notify user| U
  U -->|✅ Approve| D
  D -->|Approved| E[Token Vault]
  E -->|Short-lived payment token| F[Airline API]
  F -->|Booking confirmed| A
  A -->|Audit log: booking + identity| G[(Audit Store)]
  style D fill:#0d9488,color:#fff
  style E fill:#6d28d9,color:#fff
  style B fill:#6d28d9,color:#fff`,
  },
  {
    id: "exec-assistant",
    name: "AI Executive Assistant",
    icon: Briefcase,
    color: "hsl(174 62% 47%)",
    description: "Demonstrates delegated access with consent flows for email and calendar management.",
    diagram: `graph TD
  U([👤 User]) -->|Chat: Schedule a meeting with Alice| A([🤖 Exec Assistant])
  A -->|search_contacts - delegated token| B[Contacts API]
  B -->|Alice's details| A
  A -->|read_calendar| C[Calendar API]
  C -->|Available slots| A
  A -->|schedule_meeting - requires consent| D{Explicit Consent}
  D -->|Show details to user| U
  U -->|✅ Confirm| D
  D -->|Token Vault: Google Calendar token| E[Calendar API]
  E -->|Event created| A
  A -->|send_email invite - requires consent| F{Consent #2}
  F -->|✅ Approved| G[Email API]
  style D fill:#0d9488,color:#fff
  style F fill:#0d9488,color:#fff`,
  },
  {
    id: "personal-shopper",
    name: "AI Personal Shopper",
    icon: ShoppingBag,
    color: "hsl(262 60% 55%)",
    description: "FGA controls browsing vs purchasing, with identity context for personalization.",
    diagram: `graph TD
  U([👤 User]) -->|Chat: Find me running shoes| A([🤖 Shopper])
  A -->|Request identity context| B[Auth0]
  B -->|Filtered: tier=premium, size=10, sport=running| A
  A -->|search_products + get_recommendations| C{FGA}
  C -->|✅ catalog:read allowed| D[Product Catalog]
  D -->|Personalized results| A
  U -->|Order the Nike ones| A
  A -->|place_order - payments:charge required| E{Async Auth}
  E -->|Show order details + price| U
  U -->|✅ Approve| E
  E -->|Token Vault payment token| F[Payment API]
  F -->|Order confirmed| A
  style B fill:#6d28d9,color:#fff
  style C fill:#6d28d9,color:#fff
  style E fill:#0d9488,color:#fff`,
  },
  {
    id: "dev-copilot",
    name: "AI Developer Copilot",
    icon: Code,
    color: "hsl(142 60% 45%)",
    description: "Scoped tool access with Token Vault for GitHub, full audit trail for compliance.",
    diagram: `graph TD
  U([👤 User]) -->|Chat: Review and commit my changes| A([🤖 Dev Copilot])
  A -->|list_repos - repos:read scope| B{FGA: repos:read?}
  B -->|✅ Yes| C[GitHub via Token Vault]
  C -->|Repo list| A
  A -->|review_pr - repos:read + reviews:write| D[PR Review]
  D -->|Review complete| A
  A -->|create_commit - repos:write scope| E{Async Auth}
  E -->|Show diff + commit msg| U
  U -->|✅ Approve| E
  E -->|Token Vault: GitHub PAT| F[GitHub API]
  F -->|Commit created| A
  A -->|Log: user=X agent=copilot action=commit| G[(Audit Trail)]
  style B fill:#6d28d9,color:#fff
  style C fill:#6d28d9,color:#fff
  style E fill:#0d9488,color:#fff
  style G fill:#059669,color:#fff`,
  },
  {
    id: "generic-agent",
    name: "Generic Tool Agent",
    icon: Wrench,
    color: "hsl(45 90% 55%)",
    description: "Bare-bones illustration of all Auth0 patterns in sequence.",
    diagram: `graph TD
  U([👤 User]) -->|Request| A([🤖 Agent])
  A -->|Every tool call| B{FGA Check}
  B -->|Read action| C[✅ Execute directly]
  B -->|Write action| D{Async Auth}
  D -->|Requires human approval| U
  U -->|Decision| D
  D -->|Approved| E[Token Vault]
  E -->|Scoped token| F[External API]
  F --> A
  A -->|All actions| G[(Audit Trail)]
  style B fill:#6d28d9,color:#fff
  style D fill:#0d9488,color:#fff
  style E fill:#6d28d9,color:#fff
  style G fill:#059669,color:#fff`,
  },
];

const conceptIconMap: Record<string, React.ElementType> = {
  "token-vault": Shield,
  "async-auth": UserCheck,
  fga: Key,
  delegation: ArrowRightLeft,
  audit: FileText,
  "identity-context": User,
};

export default function Concepts() {
  const [activeTab, setActiveTab] = useState("concepts");

  return (
    <DashboardLayout>
    <div className="min-h-full bg-background">
      {/* Hero gradient */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-64 z-0"
        style={{ background: "radial-gradient(ellipse at 50% 0%, hsl(262 80% 50% / 0.15) 0%, transparent 70%)" }}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background">CONCEPTS</span>
            <span className="text-sm text-muted-foreground">Auth0 for AI Agents</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">How it works</h1>
          <p className="text-muted-foreground max-w-2xl">
            Visual diagrams of each demo's authorization flow and deep-dives into the core Auth0 primitives that power secure AI agents.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="mb-8">
            <TabsTrigger value="concepts">Core Concepts</TabsTrigger>
            <TabsTrigger value="demos">Demo Flows</TabsTrigger>
          </TabsList>

          {/* ─── Core Concepts ─── */}
          <TabsContent value="concepts">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {CONCEPTS.map((concept, i) => {
                const Icon = conceptIconMap[concept.id] || Shield;
                return (
                  <motion.div
                    key={concept.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.07 }}
                    className="flex flex-col"
                  >
                    <Card className="flex flex-col h-full border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${concept.color}18` }}>
                          <Icon className="h-5 w-5" style={{ color: concept.color }} />
                        </div>
                        <CardTitle className="text-lg">{concept.name}</CardTitle>
                        <CardDescription className="text-xs font-medium" style={{ color: concept.color }}>
                          {concept.tagline}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1 gap-4">
                        <p className="text-sm text-muted-foreground">{concept.summary}</p>

                        {/* How it works steps */}
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">How it works</p>
                          <ol className="space-y-1.5">
                            {concept.howItWorks.map((step, idx) => (
                              <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                                <span className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                                  style={{ backgroundColor: `${concept.color}25`, color: concept.color }}>
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Used in */}
                        <div className="mt-auto pt-2">
                          <p className="text-xs text-muted-foreground mb-1.5">Used in demos:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {concept.usedIn.map((d) => (
                              <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Architecture overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="mt-10"
            >
              <h2 className="text-xl font-semibold text-foreground mb-4">Overall Architecture</h2>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-3">
                    {[
                      {
                        icon: Globe,
                        title: "Identity Layer",
                        color: "hsl(262 83% 58%)",
                        items: ["User authentication", "Agent identity", "Session management", "MFA & step-up auth"],
                      },
                      {
                        icon: Lock,
                        title: "Authorization Layer",
                        color: "hsl(174 62% 47%)",
                        items: ["Fine-Grained Authorization", "Async approval gates", "Scope enforcement", "Delegated access"],
                      },
                      {
                        icon: Database,
                        title: "Credential Layer",
                        color: "hsl(45 90% 55%)",
                        items: ["Token Vault", "Secret management", "Token exchange (MCP)", "Audit logging"],
                      },
                    ].map((layer) => (
                      <div key={layer.title} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${layer.color}18` }}>
                            <layer.icon className="h-4 w-4" style={{ color: layer.color }} />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{layer.title}</span>
                        </div>
                        <ul className="space-y-1.5">
                          {layer.items.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="h-3 w-3 shrink-0" style={{ color: layer.color }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ─── Demo Flows ─── */}
          <TabsContent value="demos">
            <div className="space-y-8">
              {DEMO_FLOWS.map((demo, i) => {
                const Icon = demo.icon;
                return (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.08 }}
                  >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                      <CardHeader className="border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${demo.color}18` }}>
                            <Icon className="h-5 w-5" style={{ color: demo.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{demo.name}</CardTitle>
                            <CardDescription>{demo.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {/* Mermaid diagram rendered as code block with styling */}
                        <div className="rounded-xl border border-border/40 bg-background/60 p-5 overflow-x-auto">
                          <div className="flex items-center gap-2 mb-3">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-mono">Authorization Flow</span>
                          </div>
                          <MermaidDiagram diagram={demo.diagram} color={demo.color} />
                        </div>

                        {/* Legend */}
                        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(262 83% 58%)" }} />
                            <span>Auth0 FGA / Token Vault</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(174 62% 47%)" }} />
                            <span>Async Authorization</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(142 60% 45%)" }} />
                            <span>Audit Trail</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
    </DashboardLayout>
  );
}

// ─── Visual Mermaid-style flow renderer ───
function MermaidDiagram({ diagram, color }: { diagram: string; color: string }) {
  // Parse and render simplified flow from diagram text
  const lines = diagram.split("\n").filter(Boolean);
  const isSequence = lines[0]?.trim().startsWith("sequenceDiagram");

  if (isSequence) {
    return <SequenceRenderer lines={lines.slice(1)} color={color} />;
  }
  return <FlowRenderer lines={lines.slice(1)} color={color} />;
}

function FlowRenderer({ lines, color }: { lines: string[]; color: string }) {
  // Extract node labels and edges from mermaid syntax
  const nodeMap: Record<string, string> = {};
  const edges: { from: string; to: string; label: string; style: string }[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("style") || trimmed.startsWith("note")) return;

    // Node definitions: A([label]) or A[label] or A{label} or A[(label)]
    const nodeDef = trimmed.match(/^(\w+)\s*[\(\[\{]+[^)}\]]*[\)\]\}]+\s*[\(\[\{]+([^)}\]]+)[\)\]\}]+/);
    const nodeDef2 = trimmed.match(/^(\w+)\s*[\(\[\{]+([^)}\]]+)[\)\]\}]+/);
    if (nodeDef && !trimmed.includes("-->") && !trimmed.includes("-->>") && !trimmed.includes("->>")) {
      nodeMap[nodeDef[1]] = nodeDef[2];
    } else if (nodeDef2 && !trimmed.includes("-->") && !trimmed.includes("-->>") && !trimmed.includes("->>")) {
      nodeMap[nodeDef2[1]] = nodeDef2[2];
    }

    // Edges: A -->|label| B or A --> B
    const edgeMatch = trimmed.match(/^(\w+)\s*(?:-->|-->>|->>|-.->)\s*(?:\|([^|]*)\|)?\s*(\w+)/);
    if (edgeMatch) {
      edges.push({ from: edgeMatch[1], to: edgeMatch[3], label: edgeMatch[2] || "", style: "" });
      // also try to extract inline node labels
      const fromLabel = trimmed.match(/^(\w+)\s*[\(\[\{]+([^)}\]]+)[\)\]\}]+\s*(?:-->|-->>)/);
      if (fromLabel) nodeMap[fromLabel[1]] = fromLabel[2];
    }
  });

  // Collect all unique node ids mentioned in edges
  const nodeIds = Array.from(new Set(edges.flatMap((e) => [e.from, e.to])));

  const getLabel = (id: string) => {
    const raw = nodeMap[id] || id;
    return raw.replace(/^[👤🤖✅❌]+\s*/, "").replace(/[()[\]{}]/g, "");
  };

  const getEmoji = (id: string) => {
    const raw = nodeMap[id] || "";
    const match = raw.match(/^([👤🤖✅❌✅]+)/u);
    return match ? match[1] : "";
  };

  return (
    <div className="space-y-3">
      {/* Nodes */}
      <div className="flex flex-wrap gap-2">
        {nodeIds.map((id) => (
          <div key={id}
            className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
            {getEmoji(id) && <span>{getEmoji(id)}</span>}
            <span className="font-mono text-[11px]">{getLabel(id)}</span>
          </div>
        ))}
      </div>
      {/* Edges */}
      <div className="space-y-1.5">
        {edges.map((edge, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <span className="text-foreground">{getLabel(edge.from)}</span>
            <span className="flex-1 flex items-center gap-1">
              <span className="text-border">──</span>
              {edge.label && (
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]" style={{ color }}>
                  {edge.label}
                </span>
              )}
              <span className="text-border">──▶</span>
            </span>
            <span className="text-foreground">{getLabel(edge.to)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SequenceRenderer({ lines, color }: { lines: string[]; color: string }) {
  const participants: Record<string, string> = {};
  const messages: { from: string; to: string; label: string; dashed: boolean; note?: string }[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const partMatch = trimmed.match(/^participant\s+(\w+)\s+as\s+(.+)/);
    if (partMatch) { participants[partMatch[1]] = partMatch[2]; return; }
    const msgMatch = trimmed.match(/^(\w+)(?:->>|-->|->)(\w+):\s*(.+)/);
    const dashedMatch = trimmed.match(/^(\w+)-->>(\w+):\s*(.+)/);
    if (dashedMatch) {
      messages.push({ from: dashedMatch[1], to: dashedMatch[2], label: dashedMatch[3], dashed: true });
    } else if (msgMatch) {
      messages.push({ from: msgMatch[1], to: msgMatch[2], label: msgMatch[3], dashed: false });
    }
    if (trimmed.startsWith("alt ") || trimmed.startsWith("else ") || trimmed.startsWith("end")) {
      messages.push({ from: "", to: "", label: trimmed, dashed: false, note: trimmed });
    }
  });

  const parts = Object.entries(participants);

  return (
    <div className="space-y-3">
      {/* Participants */}
      <div className="flex flex-wrap gap-2">
        {parts.map(([id, label]) => (
          <div key={id} className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground">
            <span className="font-mono text-[11px]">{label}</span>
          </div>
        ))}
      </div>
      {/* Messages */}
      <div className="space-y-1.5">
        {messages.map((msg, i) => {
          if (msg.note) {
            return (
              <div key={i} className="text-[10px] text-muted-foreground italic pl-2 border-l-2 border-border">
                {msg.note}
              </div>
            );
          }
          const fromLabel = participants[msg.from] || msg.from;
          const toLabel = participants[msg.to] || msg.to;
          return (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="text-foreground text-[11px]">{fromLabel}</span>
              <span className="flex-1 flex items-center gap-1">
                <span className="text-border">{msg.dashed ? "- -" : "──"}</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] truncate max-w-[200px]" style={{ color }}>
                  {msg.label}
                </span>
                <span className="text-border">──▶</span>
              </span>
              <span className="text-foreground text-[11px]">{toLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
