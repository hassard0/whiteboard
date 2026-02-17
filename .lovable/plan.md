

# Auth0 AI Demo Platform — Implementation Plan

## Vision
A **living reference architecture** where each Auth0 user gets their own isolated demo sandbox. Sales Engineers demo AI agents that are visibly controlled by Auth0 — showing approval gates, delegated access, and identity-driven authorization in real-time.

---

## Phase 1: Foundation & Authentication

### Auth0 Login + Supabase Integration
- Integrate **@auth0/auth0-react** for user login (Auth0 SPA SDK)
- On login, sync the Auth0 `sub` to a Supabase `profiles` table via edge function
- Derive `env_id` from `hash(auth0_sub + demo_template_id)` — this is the isolation key
- Store Auth0 custom claims (`demo_env_id`, `demo_template_id`, `demo_mode`) and use them to scope all backend queries

### Supabase Database Schema
- `profiles` — synced from Auth0 on login
- `demo_environments` — per-user, per-template isolated state
- `demo_templates` — the 5 pre-built templates + generic agent
- `agent_memory` — per-environment conversation/context storage
- `tool_state` — per-environment tool execution state
- `approval_requests` — per-environment approval decisions
- `audit_logs` — per-environment event timeline
- All tables scoped by `env_id` with RLS policies enforcing isolation

---

## Phase 2: Demo Template System

### 5 Pre-Built Templates
Each template defines: tools available, Auth0 features demonstrated, system prompt components, and mock tool behaviors.

1. **AI Travel Agent** — Books flights/hotels, shows delegated access & approval for purchases
2. **AI Executive Assistant** — Sends emails, schedules meetings, shows consent & Token Vault delegation
3. **AI Personal Shopper** — Browses catalogs, places orders, shows fine-grained authorization
4. **AI Developer Copilot** — Manages commits, deploys, docs, shows scoped tool access
5. **Generic Tool-Calling Agent** — Configurable tools, shows raw auth patterns

### Template Architecture
- Each template is a JSON config: tools, scopes, Auth0 features, knowledge packs
- Tools use a unified interface (mock now, swap to real later)
- Mock tools return realistic fake data with configurable delays

---

## Phase 3: AI Agent Engine

### Per-Environment AI Agent
- Edge function calling **Lovable AI (Gemini)** with per-environment system prompts
- System prompt is **programmatically assembled** from: template config + Auth0 feature mapping + knowledge packs
- Agent respects scopes from the user's token — won't attempt actions outside its permissions
- Streaming responses rendered with markdown support

### Auth0 Knowledge Injection
- **Static Knowledge Pack**: Canonical Auth0/AI Agents explanations baked into prompts
- **Template Knowledge**: "This demo uses Token Vault because..." explanations
- **Runtime Narration**: After each action, explain what Auth0 did and why
- **Approval Copy**: Human-readable consent dialogs explaining delegation

### Tool Calling with Authorization
- Agent declares intent to use a tool → system checks scopes
- Protected actions trigger **approval requests** shown to the user
- Approved/denied decisions stored per-environment, never reused

---

## Phase 4: Demo Experience (Customer-Facing)

### Chat Interface
- Full-screen chat with the AI agent, Auth0-branded (dark navy, Auth0 logo, Okta colors)
- Each message shows which identity context is active
- Tool calls displayed as expandable cards showing: action, scope required, authorization decision

### Approval Gates (Visual)
- Modal dialogs when the agent needs permission: "Executive Assistant wants to send an email on your behalf"
- Each approval shows: agent name, action, data summary, Auth0 feature explanation
- Approve/Deny buttons with explanations of what happens

### Token Vault Visualization
- Visual flow showing token delegation: User → Auth0 → Token Vault → Provider
- Mock mode shows the same UI with fake token objects
- Clear labels: "This is delegated access, your credentials are never exposed to the AI"

### Authorization Explainer Panels
- Side panel or inline callouts explaining: "This action was allowed because your token includes the `calendar:write` scope"
- Visual scope badges on each tool call

---

## Phase 5: SE Builder Mode

### Template Configurator
- SE logs in with `demo_mode=builder`
- Can customize: which tools are enabled, which Auth0 features to highlight, custom system prompt additions
- Preview mode uses the same isolation model — SE sees exactly what the customer will see
- Save configurations as persistent environments for reuse

### Demo Launcher
- Dashboard showing all 5 templates as cards
- One-click launch into any demo
- Quick-reset button: clears AI memory, tool state, approvals — keeps template

---

## Phase 6: Observability & Timeline

### Per-Demo Event Timeline
- Visual timeline sidebar showing: auth events, tool invocations, token exchanges, approval decisions
- Each event is clickable with details
- This timeline IS the demo — it shows Auth0's value visually

### Environment Controls
- Reset button (clears state, preserves template)
- Environment type toggle: Ephemeral / Persistent
- Shareable snapshot: generate a read-only replay link for async customer follow-up

---

## Design & Branding
- **Auth0/Okta brand**: Dark navy background, Auth0 orange accents, clean enterprise typography
- Professional, enterprise-ready feel
- Clear visual hierarchy: identity boundaries, approval gates, delegation flows all visually distinct
- Responsive but optimized for desktop demo scenarios

---

## Technical Summary
- **Frontend**: React + Tailwind + Auth0 SPA SDK
- **Backend**: Supabase (database + edge functions + RLS for isolation)
- **AI**: Lovable AI Gateway (Gemini) via edge functions
- **Auth**: Auth0 for login, custom claims for environment scoping
- **Isolation**: All data scoped by `env_id`, enforced at database level via RLS

