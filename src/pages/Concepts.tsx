import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import mermaid from "mermaid";
import { cn } from "@/lib/utils";
import { renderMermaid } from "@/lib/mermaid-queue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhiteboardModal } from "@/components/demo/WhiteboardModal";
import {
  Shield, Key, UserCheck, ArrowRightLeft, FileText, User,
  Plane, Briefcase, ShoppingBag, Code, Wrench,
  Globe, Lock, Database, CheckCircle, GitBranch, X, Maximize2, PenLine,
} from "lucide-react";

// ─── Mermaid init ───
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    background: "#0a0a0f",
    primaryColor: "#6d28d9",
    primaryTextColor: "#f5f5f5",
    primaryBorderColor: "#4c1d95",
    lineColor: "#7c3aed",
    secondaryColor: "#1e1b2e",
    tertiaryColor: "#14121f",
    edgeLabelBackground: "#1e1b2e",
    clusterBkg: "#1e1b2e",
    titleColor: "#f5f5f5",
    nodeBorder: "#4c1d95",
    mainBkg: "#1e1b2e",
    nodeTextColor: "#f5f5f5",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "13px",
    actorBkg: "#1e1b2e",
    actorBorder: "#6d28d9",
    actorTextColor: "#f5f5f5",
    actorLineColor: "#6d28d9",
    signalColor: "#a78bfa",
    signalTextColor: "#f5f5f5",
    labelBoxBkgColor: "#1e1b2e",
    labelBoxBorderColor: "#6d28d9",
    labelTextColor: "#f5f5f5",
    loopTextColor: "#a78bfa",
    noteBorderColor: "#6d28d9",
    noteBkgColor: "#14121f",
    noteTextColor: "#d4c5ff",
    activationBorderColor: "#6d28d9",
    activationBkgColor: "#2d1b69",
  },
  flowchart: { curve: "basis", padding: 20, useMaxWidth: true },
  sequence: { mirrorActors: false, useMaxWidth: true },
});

// Shared SVG cache so whiteboard can reuse rendered SVGs
export const renderedSvgCache: Record<string, string> = {};

function MermaidDiagram({ diagram, cacheKey }: { diagram: string; cacheKey?: string }) {
  const [svg, setSvg] = useState<string>(cacheKey ? (renderedSvgCache[cacheKey] ?? "") : "");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cacheKey && renderedSvgCache[cacheKey]) {
      setSvg(renderedSvgCache[cacheKey]);
      return;
    }
    let cancelled = false;
    renderMermaid(diagram)
      .then((rendered) => {
        if (!cancelled) {
          if (cacheKey) renderedSvgCache[cacheKey] = rendered;
          setSvg(rendered);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => { cancelled = true; };
  }, [diagram, cacheKey]);

  if (error) {
    return (
      <div className="text-xs text-muted-foreground font-mono whitespace-pre-wrap p-3 rounded bg-muted/30 leading-relaxed">
        {diagram}
      </div>
    );
  }
  if (!svg) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
        Rendering diagram…
      </div>
    );
  }
  return (
    <div
      className="overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ─── Fullscreen Modal ───
function DiagramModal({ diagram, title, onClose }: { diagram: string; title: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />

        {/* Content */}
        <motion.div
          className="relative z-10 w-full max-w-5xl rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{title}</span>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Diagram */}
          <div className="p-8 overflow-auto max-h-[80vh]">
            <MermaidDiagram diagram={diagram} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
  U(["👤 User"]) -->|Grants consent| TV["🔐 Auth0 Token Vault"]
  TV -->|Stores encrypted| CS[("Credential Store")]
  AG(["🤖 AI Agent"]) -->|Requests access| TV
  TV -->|Validates identity + scope| SC{"Scope Check"}
  SC -->|✅ Authorized| TK["Short-lived Token"]
  TK --> AG
  AG -->|Uses token| API["Third-Party API"]`,
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
      "User receives a notification or in-app prompt",
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
  AZ->>U: Notify: action requires your approval
  U->>AZ: Approve or Deny
  AZ->>A: Decision recorded
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
      "Permissions can be scoped to specific resources",
      "Changes to permissions take effect in real-time",
    ],
    diagram: `graph TD
  A(["🤖 AI Agent"]) -->|Calls tool| B{"FGA Check"}
  B -->|Query: can agent do X on Y?| C[("FGA Store")]
  C --> D{"Authorized?"}
  D -->|✅ Yes| E["Tool Executes"]
  D -->|❌ No| F["Blocked + Logged"]
  G(["👤 User"]) -->|Grants permissions| C`,
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
  U(["👤 User"]) -->|Full token| AZ["Auth0"]
  U -->|Grants delegation| AZ
  AZ -->|Issues bounded token| AG(["🤖 AI Agent"])
  AG -->|Scoped delegation token| SVC["Service API"]
  SVC --> DATA[("User Data")]
  U -->|Can revoke anytime| AZ`,
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
      "Auth0 intercepts and logs: user, agent, scopes, timestamp",
      "The action result (success/failure) is appended to the log",
      "Approval decisions include user identity and reasoning",
      "Logs are tamper-evident with retention policies",
      "Audit trail is queryable for compliance reports",
    ],
    diagram: `graph LR
  AG(["🤖 AI Agent"]) -->|Tool call + token| MW["Auth0 Middleware"]
  MW -->|Extract identity context| AL["Audit Logger"]
  AL -->|Structured event| AS[("Audit Store")]
  MW -->|Forward request| T["Tool / API"]
  T -->|Result| MW
  MW -->|Append result| AL
  CT(["👤 Compliance Team"]) -->|Query| AS`,
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
      "Agent uses context for personalization",
      "Raw identifiers (email, SSN, etc.) are never passed to the agent",
      "Context changes (e.g. role change) are reflected in real-time",
    ],
    diagram: `graph LR
  AG(["🤖 AI Agent"]) -->|Request: identity context| AZ["Auth0"]
  AZ -->|Filter by scope| UP[("User Profile")]
  UP -->|Full profile| AZ
  AZ -->|Filtered context only| AG
  AG -->|Personalizes response| U(["👤 User"])`,
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
  U(["👤 User"]) -->|Book me a flight to NYC| AG(["🤖 Travel Agent"])
  AG -->|search_flights| FGA{"FGA Check\nflights:read"}
  FGA -->|✅ Allowed| SR["Search Results"]
  SR --> AG
  AG -->|book_flight requires approval| AA{"Async Authorization"}
  AA -->|Notify user| U
  U -->|✅ Approve| AA
  AA -->|Approved| TV["Token Vault"]
  TV -->|Short-lived payment token| AAPI["Airline API"]
  AAPI -->|Booking confirmed| AG
  AG -->|Log: booking + identity| AUD[("Audit Log")]`,
  },
  {
    id: "exec-assistant",
    name: "AI Executive Assistant",
    icon: Briefcase,
    color: "hsl(174 62% 47%)",
    description: "Demonstrates delegated access with consent flows for email and calendar management.",
    diagram: `graph TD
  U(["👤 User"]) -->|Schedule meeting with Alice| AG(["🤖 Exec Assistant"])
  AG -->|Use delegated token| AZ["Auth0"]
  AG -->|read_calendar| CAL["Calendar API"]
  CAL -->|Available slots| AG
  AG -->|Request consent: schedule_meeting| AA1{"Async Authorization"}
  AA1 -->|Confirm: create event at 3pm?| U
  U -->|✅ Approve| AA1
  AA1 -->|Token Vault: calendar token| CAL2["Create Event"]
  CAL2 -->|Event created| AG
  AG -->|Request consent: send_email| AA2{"Async Authorization"}
  AA2 -->|Confirm: send invite to Alice?| U
  U -->|✅ Approve| AA2
  AA2 -->|Token Vault: email token| EMAIL["Email API"]
  EMAIL -->|Sent| AG`,
  },
  {
    id: "personal-shopper",
    name: "AI Personal Shopper",
    icon: ShoppingBag,
    color: "hsl(262 60% 55%)",
    description: "FGA controls browsing vs purchasing, with identity context for personalization.",
    diagram: `graph TD
  U(["👤 User"]) -->|Find me running shoes| AG(["🤖 Shopper"])
  AG -->|Request identity context| AZ["Auth0"]
  AZ -->|Filtered: tier=premium, size=10| AG
  AG -->|search_products + recommendations| FGA{"FGA Check\ncatalog:read"}
  FGA -->|✅ Allowed| CAT["Product Catalog"]
  CAT -->|Personalized results| AG
  AG -->|Present options| U
  U -->|Order the Nike ones| AG
  AG -->|place_order| AA{"Async Authorization\npayments:charge"}
  AA -->|Show order + price| U
  U -->|✅ Approve| AA
  AA -->|Token Vault payment token| PAY["Payment API"]
  PAY -->|Order confirmed| AG`,
  },
  {
    id: "dev-copilot",
    name: "AI Developer Copilot",
    icon: Code,
    color: "hsl(142 60% 45%)",
    description: "Scoped tool access with Token Vault for GitHub, full audit trail for compliance.",
    diagram: `graph TD
  U(["👤 User"]) -->|Review and commit my changes| AG(["🤖 Dev Copilot"])
  AG -->|list_repos| FGA1{"FGA Check\nrepos:read"}
  FGA1 -->|✅ Allowed| GH["GitHub via Token Vault"]
  GH -->|Repo list| AG
  AG -->|review_pr| PR["PR Review"]
  PR -->|Review complete| AG
  AG -->|create_commit repos:write| AA{"Async Authorization"}
  AA -->|Show diff + commit message| U
  U -->|✅ Approve| AA
  AA -->|Token Vault: GitHub PAT| GHAPI["GitHub API"]
  GHAPI -->|Commit created| AG
  AG -->|Log: user+agent+action| AUD[("Audit Trail")]`,
  },
  {
    id: "generic-agent",
    name: "Generic Tool Agent",
    icon: Wrench,
    color: "hsl(45 90% 55%)",
    description: "Bare-bones illustration of all Auth0 patterns in sequence.",
    diagram: `graph TD
  U(["👤 User"]) -->|Request| AG(["🤖 Agent"])
  AG -->|Every tool call| FGA{"FGA Check"}
  FGA -->|Read action| READ["✅ Execute directly"]
  FGA -->|Write action| AA{"Async Authorization"}
  AA -->|Needs human approval| U
  U -->|Decision| AA
  AA -->|Approved| TV["Token Vault"]
  TV -->|Scoped token| API["External API"]
  API --> AG
  AG -->|All actions logged| AUD[("Audit Trail")]`,
  },
];

export default function Concepts() {
  const [activeTab, setActiveTab] = useState("concepts");
  const [modalDiagram, setModalDiagram] = useState<{ diagram: string; title: string } | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // Stable diagram list — re-compute only when whiteboard opens so the cache is fresh
  const whiteboardDiagrams = useMemo(
    () => [
      ...CONCEPTS.map((c) => ({ id: c.id, name: c.name, svg: renderedSvgCache[c.id] ?? "", diagram: c.diagram })),
      ...DEMO_FLOWS.map((d) => ({ id: d.id, name: d.name, svg: renderedSvgCache[d.id] ?? "", diagram: d.diagram })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [whiteboardOpen] // re-seed cache hits when modal opens
  );

  return (
    <DashboardLayout>
      <div className="min-h-full bg-background">
        {/* Hero gradient */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-64 z-0"
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
            <div className="flex items-center gap-3 mb-8">
              <TabsList>
                <TabsTrigger value="concepts">Core Concepts</TabsTrigger>
                <TabsTrigger value="demos">Demo Flows</TabsTrigger>
              </TabsList>

              {/* Whiteboard button */}
              <motion.button
                onClick={() => setWhiteboardOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                title="Open Whiteboard"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground shadow-sm hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
              >
                <PenLine className="h-4 w-4" />
              </motion.button>
            </div>

            {/* ─── Core Concepts ─── */}
            <TabsContent value="concepts">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {CONCEPTS.map((concept, i) => {
                  const Icon = concept.icon;
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
                          <div
                            className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${concept.color}18` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: concept.color }} />
                          </div>
                          <CardTitle className="text-lg">{concept.name}</CardTitle>
                          <CardDescription className="text-xs font-medium" style={{ color: concept.color }}>
                            {concept.tagline}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1 gap-4">
                          <p className="text-sm text-muted-foreground">{concept.summary}</p>

                          {/* Diagram — click to expand */}
                          <div
                            className="group relative rounded-xl border border-border/40 bg-background/60 p-4 cursor-pointer hover:border-border/70 transition-colors"
                            onClick={() => setModalDiagram({ diagram: concept.diagram, title: concept.name })}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <GitBranch className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-mono">Flow Diagram</span>
                              </div>
                              <Maximize2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <MermaidDiagram diagram={concept.diagram} cacheKey={concept.id} />
                          </div>

                          {/* How it works steps */}
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">How it works</p>
                            <ol className="space-y-1.5">
                              {concept.howItWorks.map((step, idx) => (
                                <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                                  <span
                                    className="shrink-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                                    style={{ backgroundColor: `${concept.color}25`, color: concept.color }}
                                  >
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
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${layer.color}18` }}
                            >
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
                            <div
                              className="flex h-10 w-10 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${demo.color}18` }}
                            >
                              <Icon className="h-5 w-5" style={{ color: demo.color }} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{demo.name}</CardTitle>
                              <CardDescription>{demo.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-4">
                            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground font-mono">Authorization Flow</span>
                          </div>
                          <div className="rounded-xl border border-border/40 bg-background/60 p-5">
                            <MermaidDiagram diagram={demo.diagram} cacheKey={demo.id} />
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

      {/* Fullscreen diagram modal */}
      {modalDiagram && (
        <DiagramModal
          diagram={modalDiagram.diagram}
          title={modalDiagram.title}
          onClose={() => setModalDiagram(null)}
        />
      )}

      {/* Whiteboard modal */}
      {whiteboardOpen && (
        <WhiteboardModal
          diagrams={whiteboardDiagrams}
          onClose={() => setWhiteboardOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
