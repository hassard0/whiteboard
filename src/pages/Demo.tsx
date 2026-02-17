import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getTemplateById, generateEnvId } from "@/lib/demo-templates";
import { AUTOPILOT_SCRIPTS } from "@/lib/autopilot-scripts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Shield, Send, Share2, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ApprovalModal, type ApprovalRequest } from "@/components/demo/ApprovalModal";
import { ToolCallCard, type ToolCallDisplay } from "@/components/demo/ToolCallCard";
import { EventTimeline, type TimelineEvent } from "@/components/demo/EventTimeline";
import { AutopilotControls } from "@/components/demo/AutopilotControls";
import { ArchitectureShelf } from "@/components/demo/ArchitectureShelf";
import { toast } from "sonner";
import auth0Shield from "@/assets/auth0-shield.png";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallDisplay[];
}

export default function DemoPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth0();
  const baseTemplate = getTemplateById(templateId || "");

  const builderConfig = (location.state as any)?.builderConfig;
  const customDemo = (location.state as any)?.customDemo;

  // Build the template — support custom wizard demos, builder configs, or pre-built
  const template = customDemo
    ? {
        id: templateId || "custom",
        name: customDemo.name || "Custom Demo",
        description: customDemo.description || "",
        icon: customDemo.icon || "Sparkles",
        color: customDemo.color || "hsl(262 83% 58%)",
        tools: customDemo.tools || [],
        auth0Features: customDemo.auth0Features || [],
        systemPromptParts: customDemo.systemPromptParts || [],
        knowledgePack: customDemo.knowledgePack || "",
      }
    : baseTemplate
    ? {
        ...baseTemplate,
        tools: builderConfig?.enabledTools
          ? baseTemplate.tools.filter((t) => builderConfig.enabledTools.includes(t.id))
          : baseTemplate.tools,
        auth0Features: builderConfig?.enabledFeatures
          ? baseTemplate.auth0Features.filter((f) => builderConfig.enabledFeatures.includes(f.id))
          : baseTemplate.auth0Features,
        systemPromptParts: [
          ...baseTemplate.systemPromptParts,
          ...(builderConfig?.customPrompt ? [builderConfig.customPrompt] : []),
        ],
        knowledgePack: baseTemplate.knowledgePack + (builderConfig?.customKnowledge ? "\n\n" + builderConfig.customKnowledge : ""),
      }
    : null;

  // Build autopilot script from custom demo or pre-built
  const customAutopilot = customDemo?.autopilotSteps?.length
    ? {
        templateId: templateId || "custom",
        title: `${customDemo.name} Walkthrough`,
        description: customDemo.description || "",
        steps: customDemo.autopilotSteps.map((s: any, i: number) => ({
          id: `step-${i}`,
          label: s.label,
          userMessage: s.message,
          explanation: s.explanation,
          highlightFeature: s.feature,
        })),
      }
    : undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [pendingToolContext, setPendingToolContext] = useState<any>(null);
  const [lastToolCall, setLastToolCall] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Autopilot state
  const autopilotScript = customAutopilot || (templateId ? AUTOPILOT_SCRIPTS[templateId] : undefined);
  const [autopilotActive, setAutopilotActive] = useState(false);
  const [autopilotStep, setAutopilotStep] = useState(0);
  const [autopilotWaiting, setAutopilotWaiting] = useState(false);

  const envId = user?.sub && templateId ? generateEnvId(user.sub, templateId) : "unknown";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (user?.email) {
      addTimelineEvent("auth", "User Authenticated", `${user.email} via Auth0`, "success");
    }
  }, [user?.email]);

  const addTimelineEvent = useCallback((
    type: TimelineEvent["type"],
    title: string,
    detail?: string,
    status?: TimelineEvent["status"],
    auth0Feature?: string,
  ) => {
    setTimelineEvents((prev) => [
      {
        id: crypto.randomUUID(),
        type,
        title,
        detail,
        status,
        timestamp: new Date(),
        auth0Feature,
      },
      ...prev,
    ]);
  }, []);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Template not found</h1>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const callAgent = async (
    chatMessages: { role: string; content: string }[],
    pendingApprovals?: any[],
  ) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-chat`;
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: chatMessages,
        template_id: template.id,
        env_id: envId,
        system_prompt_parts: template.systemPromptParts,
        knowledge_pack: template.knowledgePack,
        tools: template.tools,
        pending_approvals: pendingApprovals,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      if (resp.status === 429) toast.error("Rate limit exceeded. Please wait a moment.");
      else if (resp.status === 402) toast.error("AI usage limit reached.");
      else throw new Error(errBody || "Agent error");
      return null;
    }

    return resp.json();
  };

  const processAgentResponse = async (
    data: any,
    chatHistory: { role: string; content: string }[],
  ) => {
    const toolCalls: ToolCallDisplay[] = [];

    for (const tc of data.tool_calls || []) {
      if (tc.type === "executed") {
        toolCalls.push({
          id: crypto.randomUUID(),
          toolName: tc.tool_name,
          toolDescription: tc.tool_description,
          scopes: tc.scopes,
          status: "completed",
          requiresApproval: false,
          result: JSON.stringify(tc.result, null, 2),
          timestamp: new Date(),
        });
        setLastToolCall(tc.tool_name);
        addTimelineEvent("tool_call", `${tc.tool_name} executed`, `Scopes: ${tc.scopes.join(", ")}`, "success");
      } else if (tc.type === "approval_required") {
        toolCalls.push({
          id: crypto.randomUUID(),
          toolName: tc.tool_name,
          toolDescription: tc.tool_description,
          scopes: tc.scopes,
          status: "pending",
          requiresApproval: true,
          auth0Feature: "Async Authorization",
          timestamp: new Date(),
        });

        addTimelineEvent("approval", `Approval requested: ${tc.tool_name}`, tc.tool_description, "pending", "Async Authorization");

        const approvalReq: ApprovalRequest = {
          id: crypto.randomUUID(),
          toolName: tc.tool_name,
          toolDescription: tc.tool_description,
          scopes: tc.scopes,
          dataSummary: tc.args?.reason ? { Reason: tc.args.reason } : {},
          auth0Feature: "Async Authorization",
          auth0Explanation: "This action requires explicit human approval. Auth0's Async Authorization pattern ensures AI agents cannot perform sensitive actions without user consent.",
        };

        setPendingToolContext({
          toolCall: tc,
          chatHistory,
          content: data.content,
          otherToolCalls: toolCalls,
        });
        setApprovalRequest(approvalReq);
        return { content: data.content, toolCalls, awaitingApproval: true };
      }
    }

    if (toolCalls.length > 0 && toolCalls.every((tc) => tc.status === "completed")) {
      const executedResults = (data.tool_calls || [])
        .filter((tc: any) => tc.type === "executed")
        .map((tc: any) => ({
          decision: "approved",
          tool_id: tc.tool_id,
          args: tc.args,
        }));

      const followUp = await callAgent(
        [...chatHistory, { role: "assistant", content: data.content || "I'll use some tools to help." }],
        executedResults,
      );

      if (followUp?.content) {
        return { content: followUp.content, toolCalls, awaitingApproval: false };
      }
    }

    return { content: data.content, toolCalls, awaitingApproval: false };
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    addTimelineEvent("message", "User message", messageText.trim().slice(0, 60));

    try {
      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await callAgent(chatHistory);
      if (!data) { setIsLoading(false); setAutopilotWaiting(false); return; }

      const result = await processAgentResponse(data, chatHistory);
      if (!result) { setIsLoading(false); setAutopilotWaiting(false); return; }

      if (!result.awaitingApproval) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.content || "",
            timestamp: new Date(),
            toolCalls: result.toolCalls,
          },
        ]);
        addTimelineEvent("message", "Agent response", result.content?.slice(0, 60));
      } else {
        if (result.content) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: result.content,
              timestamp: new Date(),
              toolCalls: result.toolCalls,
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      if (!approvalRequest) {
        setIsLoading(false);
        setAutopilotWaiting(false);
      }
    }
  };

  const handleSend = () => sendMessage(input);

  const handleApprovalDecision = async (requestId: string, decision: "approved" | "denied") => {
    setApprovalRequest(null);
    const ctx = pendingToolContext;
    if (!ctx) { setIsLoading(false); setAutopilotWaiting(false); return; }

    addTimelineEvent(
      "approval",
      `${decision === "approved" ? "Approved" : "Denied"}: ${ctx.toolCall.tool_name}`,
      undefined,
      decision === "approved" ? "success" : "denied",
      "Async Authorization",
    );

    if (decision === "approved") {
      addTimelineEvent("token_exchange", "Token delegated for tool execution", `${ctx.toolCall.tool_name}`, "success", "Token Vault");
    }

    try {
      const followUp = await callAgent(ctx.chatHistory, [
        { decision, tool_id: ctx.toolCall.tool_id, args: ctx.toolCall.args },
      ]);

      if (followUp) {
        const toolCalls: ToolCallDisplay[] = (ctx.otherToolCalls || []).map((tc: ToolCallDisplay) =>
          tc.toolName === ctx.toolCall.tool_name
            ? { ...tc, status: decision === "approved" ? "completed" as const : "denied" as const }
            : tc
        );

        for (const tc of followUp.tool_calls || []) {
          if (tc.type === "executed") {
            toolCalls.push({
              id: crypto.randomUUID(),
              toolName: tc.tool_name,
              toolDescription: tc.tool_description,
              scopes: tc.scopes,
              status: "completed",
              requiresApproval: false,
              result: JSON.stringify(tc.result, null, 2),
              timestamp: new Date(),
            });
            setLastToolCall(tc.tool_name);
          }
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: followUp.content || (decision === "approved" ? "Action completed." : "Action was denied."),
            timestamp: new Date(),
            toolCalls,
          },
        ]);
        addTimelineEvent("message", "Agent response", followUp.content?.slice(0, 60));
      }
    } catch (e) {
      console.error("Post-approval error:", e);
      toast.error("Error processing approval result");
    } finally {
      setPendingToolContext(null);
      setIsLoading(false);
      setAutopilotWaiting(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const RESET_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-environment`;
      await fetch(RESET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ env_id: envId }),
      });
    } catch (e) {
      console.error("Reset error:", e);
    }
    setMessages([]);
    setTimelineEvents([]);
    setPendingToolContext(null);
    setApprovalRequest(null);
    setAutopilotActive(false);
    setAutopilotStep(0);
    setAutopilotWaiting(false);
    setLastToolCall(undefined);
    setIsResetting(false);
    addTimelineEvent("auth", "Environment reset", `Template: ${template.name}`, "success");
    toast.success("Environment reset");
  };

  const handleShare = () => {
    const snapshot = {
      t: template.id,
      ts: Date.now(),
      events: timelineEvents.slice(0, 20).map((e) => ({ type: e.type, title: e.title, status: e.status })),
      msgCount: messages.length,
    };
    const encoded = btoa(JSON.stringify(snapshot));
    const url = `${window.location.origin}/demo/${template.id}?snapshot=${encoded}`;
    navigator.clipboard.writeText(url);
    toast.success("Snapshot link copied to clipboard");
  };

  // Autopilot handlers
  const handleAutopilotStart = () => {
    setAutopilotActive(true);
    setAutopilotStep(0);
  };

  const handleAutopilotAdvance = () => {
    if (!autopilotScript || autopilotStep >= autopilotScript.steps.length) return;
    const step = autopilotScript.steps[autopilotStep];
    setAutopilotWaiting(true);
    setAutopilotStep((prev) => prev + 1);
    sendMessage(step.userMessage);
  };

  const handleAutopilotStop = () => {
    setAutopilotActive(false);
    setAutopilotStep(0);
    setAutopilotWaiting(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <img src={auth0Shield} alt="Auth0" className="h-6 w-6 invert" />
          <div>
            <h1 className="text-base font-semibold text-foreground">{template.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>env: {envId}</span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template.auth0Features.map((f) => (
            <Badge key={f.id} variant="outline" className="hidden text-xs sm:inline-flex border-primary/30 text-primary">
              <Shield className="mr-1 h-3 w-3" />
              {f.name}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="mr-1 h-4 w-4" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} disabled={isResetting}>
            {isResetting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
            Reset
          </Button>
        </div>
      </header>

      {/* Body = Chat + Timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Autopilot Sidebar — fixed left panel when active */}
        {autopilotScript && autopilotActive && (
          <div className="w-72 shrink-0 border-r border-border bg-card/50 flex flex-col overflow-y-auto">
            <AutopilotControls
              script={autopilotScript}
              currentStep={autopilotStep}
              isActive={autopilotActive}
              isWaiting={autopilotWaiting}
              onStart={handleAutopilotStart}
              onAdvance={handleAutopilotAdvance}
              onStop={handleAutopilotStop}
            />
          </div>
        )}

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {/* Autopilot start prompt when not yet active */}
              {messages.length === 0 && autopilotScript && !autopilotActive && (
                <AutopilotControls
                  script={autopilotScript}
                  currentStep={autopilotStep}
                  isActive={autopilotActive}
                  isWaiting={autopilotWaiting}
                  onStart={handleAutopilotStart}
                  onAdvance={handleAutopilotAdvance}
                  onStop={handleAutopilotStop}
                />
              )}

              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${template.color}15` }}>
                    <Shield className="h-8 w-8" style={{ color: template.color }} />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">{template.name}</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">{template.knowledgePack}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {template.tools.map((tool) => (
                      <Badge key={tool.id} variant="secondary" className="text-xs">
                        {tool.name}
                        {tool.requiresApproval && <Shield className="ml-1 h-3 w-3 text-primary" />}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}



              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[80%] space-y-2`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "gradient-auth0 text-primary-foreground"
                            : "glass-panel"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm prose-invert max-w-none prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:my-1.5 prose-headings:text-foreground prose-headings:mt-3 prose-headings:mb-1.5 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-strong:text-foreground prose-em:text-foreground/80 prose-ul:my-1.5 prose-ul:space-y-0.5 prose-ol:my-1.5 prose-ol:space-y-0.5 prose-li:text-foreground/90 prose-li:my-0 prose-code:text-primary prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:bg-secondary prose-pre:rounded-lg prose-pre:my-2 prose-blockquote:border-l-2 prose-blockquote:border-primary prose-blockquote:pl-3 prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-a:text-primary prose-a:no-underline hover:prose-a:underline [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:bg-secondary/50 [&_th]:text-foreground [&_th]:text-xs [&_th]:font-medium [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-foreground/90 [&_td]:text-sm [&_hr]:border-border">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="space-y-2">
                          {msg.toolCalls.map((tc) => (
                            <ToolCallCard key={tc.id} toolCall={tc} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && !approvalRequest && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="glass-panel flex items-center gap-2 rounded-2xl px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                    </div>
                    Thinking...
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Architecture Shelf */}
          <ArchitectureShelf
            templateName={template.name}
            activeFeatures={template.auth0Features.map((f) => f.name)}
            lastToolCall={lastToolCall}
            activeStage={
              approvalRequest ? "vault"
                : isLoading && lastToolCall ? "tools"
                : isLoading ? "agent"
                : messages.length === 0 ? "user"
                : "auth0"
            }
          />

          {/* Input */}
          <div className="border-t border-border px-4 py-4">
            <div className="mx-auto flex max-w-3xl gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={`Message ${template.name}...`}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button onClick={handleSend} disabled={!input.trim() || isLoading} className="gradient-auth0 rounded-xl px-4">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Event Timeline Sidebar */}
        <EventTimeline events={timelineEvents} />
      </div>

      {/* Approval Modal */}
      <ApprovalModal request={approvalRequest} onDecision={handleApprovalDecision} />
    </div>
  );
}