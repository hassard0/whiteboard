import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Agent Protocol Knowledge Pack ───────────────────────────────────────────
// Reference knowledge injected when the user's prompt is related to MCP, A2A,
// agent protocols, MCP auth, MCP Gateway, MCP Relay, etc.
const AGENT_PROTOCOL_KNOWLEDGE = `
## Agent & MCP Protocol Reference Knowledge

### MCP (Model Context Protocol) — by Anthropic
- Open standard connecting AI agents/LLMs to external tools, APIs, and data sources
- Client-Server architecture using JSON-RPC 2.0
- Two transports: stdio (local subprocess, no auth needed) and Streamable HTTP (remote, OAuth 2.1)
- MCP Client = the AI app/agent; MCP Server = the tool/data provider
- Resources (data), Tools (actions), Prompts (templates) are the three primitives
- 100K+ GitHub stars — the dominant protocol today

### MCP Auth / Authorization (Streamable HTTP transport)
- Uses OAuth 2.1 Authorization Code grant
- Flow: MCP Client → unauthenticated request → 401 + resource metadata URL → client fetches AS metadata → Dynamic Client Registration (DCR) or CIMD → Authorization Code flow → Access Token → authenticated MCP requests
- MCP Server = OAuth Resource Server; Auth0/IdP = Authorization Server
- RFC 9728: Protected Resource Metadata; RFC 8414: AS Metadata; RFC 7591: DCR
- Token Exchange (RFC 8693): MCP server exchanges client token for downstream service token
- Scopes: e.g. mcp:read, mcp:write, mcp:delete
- Client registration options: out-of-band, CIMD, DCR, or user-prompted
- stdio transport: no MCP-layer auth; env vars configure upstream API keys

### MCP Gateway
- A proxy/API gateway layer sitting between MCP Clients and MCP Servers
- Handles: auth enforcement, rate limiting, routing, observability, caching
- Enables centralized policy for many MCP servers behind one endpoint
- Examples: Cloudflare AI Gateway, Kong, AWS API Gateway, custom Deno/Node proxies
- Architecture: Client → Gateway (auth/rate-limit/route) → MCP Server(s) → Tools/APIs
- Can perform token validation, scope enforcement, and audit logging centrally
- Key benefit: enterprise governance without modifying individual MCP servers

### MCP Relay
- A relay/tunnel that bridges MCP Clients to remote MCP Servers across network boundaries
- Solves: stdio-only MCP servers exposed to remote clients; firewall traversal
- Pattern: Local relay converts stdio ↔ Streamable HTTP; remote clients connect to relay
- Often used in dev tooling (e.g. Cursor, Claude Code connecting to private servers)
- May handle session multiplexing and connection persistence

### A2A — Agent2Agent Protocol (by Google, 2025)
- Open protocol for agent-to-agent communication and collaboration
- Uses HTTP(S), JSON-RPC 2.0, and Server-Sent Events (SSE) for streaming
- Core concept: "Agent Cards" — JSON descriptors of agent capabilities, hosted at /.well-known/agent.json
- Agents discover each other via Agent Cards, then communicate tasks/results
- Async-first: built for long-running tasks with task state tracking
- Tasks flow: Client Agent → send Task → Remote Agent → stream updates → return Result
- Built-in security: standard HTTP auth, no agent needs to expose internal state
- 20K+ GitHub stars; backed by 50+ partners (Atlassian, Salesforce, SAP, MongoDB)
- Complements MCP: MCP = agent↔tool, A2A = agent↔agent

### ACP — Agent Communication Protocol (by IBM/BeeAI, Linux Foundation)
- RESTful API standard for agent interoperability; all modalities, sync/async/streaming
- Core features: workflow orchestration, task delegation, stateful sessions, observability
- Offline discovery support; mimetype-based content handling
- Works with any framework (LangGraph, CrewAI, AutoGen) without SDKs
- Reference implementation: BeeAI (IBM)
- Positioned as the "project manager" coordinating agents in multi-agent systems

### ANP — Agent Network Protocol
- Open-source, cross-domain agent communication using W3C DID standards
- Three layers: identity/encryption, meta-protocol negotiation, application protocols
- Goal: "Internet of Agents" with native machine-to-machine interfaces
- Decentralized identity; no central registry required

### AG-UI Protocol (Agent-User Interface Protocol)
- Lightweight event-driven protocol for AI agent ↔ frontend communication
- 16 typed event categories: lifecycle, messages, tool calls, state management
- Bidirectional state sync via JSON Patch deltas; supports SSE and binary protocols
- Human-in-the-loop workflows; real-time UI updates from streaming agents
- 4K+ GitHub stars

### AITP — Agent Interaction & Transaction Protocol (NEAR Foundation)
- Blockchain-based protocol for agent communication across trust boundaries
- Supports autonomous negotiation, value exchange, cost bidding
- Built-in identity verification; cross-organizational agent interactions

### AConP — Agent Connect Protocol (Cisco/LangChain, via Agntcy)
- OpenAPI + JSON-based specification for agent invocation and lifecycle management
- Distributed registry for global agent discovery
- Endpoints: run, interrupt, resume agent; thread-based interactions

### Agent Protocol (AI Engineer Foundation)
- Framework-agnostic RESTful standard for agent lifecycle management
- Abstractions: Runs (task execution), Threads (multi-turn), Store (persistent memory)

### agents.json (Wildcard AI)
- OpenAPI-based spec making websites AI-agent compatible; hosted at /.well-known/agents.json
- Defines flows (multi-step API sequences) and data dependencies
- "robots.txt for agents"

### Protocol Stack / Layer Model
- Layer 1 — Context & Tools: MCP (agent↔tool/data)
- Layer 2 — Agent↔Agent: A2A, ACP, ANP (agent↔agent collaboration)
- Layer 3 — Agent↔UI: AG-UI (agent↔frontend)
- Layer 4 — Discovery: Agent Cards (A2A), agents.json, ANS (Agent Name Service)
- Cross-cutting: Auth (OAuth 2.1, Token Vault, MCP Auth spec), Observability, Gateways

### MCP + Auth0 / Identity Provider Integration Patterns
- Auth0 as Authorization Server for MCP OAuth 2.1 flows
- Dynamic Client Registration for MCP clients at Auth0
- Token Vault: Auth0 stores upstream API credentials; MCP server requests scoped tokens
- Async Authorization: MCP server raises approval request before sensitive tool calls
- Fine-Grained Authorization (FGA): per-tool, per-resource permission checks before MCP tool invocation
- Audit Trail: every MCP tool call logged with full identity context (user, agent, scopes)
`;

// Keywords that trigger injection of the agent protocol knowledge pack
const AGENT_PROTOCOL_KEYWORDS = [
  "mcp", "model context protocol", "a2a", "agent2agent", "agent-to-agent",
  "acp", "agent communication", "anp", "agent network", "ag-ui", "agui",
  "aitp", "aconp", "agent connect", "agents.json", "agent card", "agent protocol",
  "mcp gateway", "mcp relay", "mcp auth", "mcp server", "mcp client",
  "agent protocol stack", "multi-agent", "inter-agent", "agent interop",
  "agent discovery", "agent orchestration", "protocol stack", "oauth mcp",
  "token exchange", "dcr", "dynamic client registration", "rfc 8693",
];

function shouldInjectKnowledge(description: string): boolean {
  const lower = description.toLowerCase();
  return AGENT_PROTOCOL_KEYWORDS.some((kw) => lower.includes(kw));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { description } = await req.json();
    if (!description?.trim()) {
      return new Response(JSON.stringify({ error: "description is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const knowledgeInjection = shouldInjectKnowledge(description)
      ? `\n\nREFERENCE KNOWLEDGE (use only if relevant to the diagram requested):\n${AGENT_PROTOCOL_KNOWLEDGE}`
      : "";

    const systemPrompt = `You are an expert Mermaid.js diagram generator.
Given a description, return ONLY the raw Mermaid diagram code — no markdown fences, no explanation, no extra text.
Rules:
- Use "graph TD" or "graph LR" for flowcharts, "sequenceDiagram" for sequence diagrams
- Keep node labels short and clear
- Use emoji sparingly and only in quotes when appropriate
- Escape special characters inside labels with quotes where needed
- Avoid colons inside unquoted labels
- Max ~15 nodes for clarity
- Always produce valid Mermaid v11 syntax${knowledgeInjection}`;

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
          { role: "user", content: description },
        ],
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`AI gateway error ${response.status}: ${text}`);
    }

    const data = await response.json();
    let mermaid = data.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip any accidental markdown fences (multiline-safe)
    mermaid = mermaid
      .replace(/^```(?:mermaid)?\s*/im, "")
      .replace(/\s*```\s*$/m, "")
      .trim();

    // If the model still wrapped in a code block somewhere in the middle, extract it
    const fenceMatch = mermaid.match(/```(?:mermaid)?\s*([\s\S]+?)\s*```/i);
    if (fenceMatch) mermaid = fenceMatch[1].trim();

    // Strip any leading prose before the diagram keyword
    const diagramKeywords = ["graph ", "sequenceDiagram", "flowchart ", "erDiagram", "classDiagram", "stateDiagram", "gantt", "pie ", "gitGraph", "mindmap", "timeline", "journey"];
    for (const kw of diagramKeywords) {
      const idx = mermaid.indexOf(kw);
      if (idx > 0) { mermaid = mermaid.slice(idx); break; }
    }

    if (!mermaid) throw new Error("AI returned empty diagram content");

    return new Response(JSON.stringify({ mermaid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[generate-mermaid]", err);
    return new Response(JSON.stringify({ error: err.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
