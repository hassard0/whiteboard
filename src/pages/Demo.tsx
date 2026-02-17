import { useParams, useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getTemplateById, generateEnvId } from "@/lib/demo-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RotateCcw, Shield, Send } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCall?: {
    toolName: string;
    scopes: string[];
    status: "pending" | "approved" | "denied" | "completed";
  };
}

export default function DemoPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const template = getTemplateById(templateId || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const envId = user?.sub && templateId ? generateEnvId(user.sub, templateId) : "unknown";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Stream AI response from edge function
    let assistantSoFar = "";
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/demo-chat`;

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          template_id: template.id,
          env_id: envId,
          system_prompt_parts: template.systemPromptParts,
          knowledge_pack: template.knowledgePack,
          tools: template.tools,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errBody = await resp.text();
        throw new Error(errBody || "Failed to start stream");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { id: crypto.randomUUID(), role: "assistant", content: assistantSoFar, timestamp: new Date() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error("Chat error:", e);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "Sorry, I encountered an error. Please try again.", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold">{template.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>env: {envId}</span>
              <span>•</span>
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {template.auth0Features.map((f) => (
            <Badge key={f.id} variant="outline" className="hidden text-xs sm:inline-flex">
              <Shield className="mr-1 h-3 w-3" />
              {f.name}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${template.color}15` }}>
                <Shield className="h-8 w-8" style={{ color: template.color }} />
              </div>
              <h2 className="text-xl font-semibold">{template.name}</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">{template.knowledgePack}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {template.tools.map((tool) => (
                  <Badge key={tool.id} variant="secondary" className="text-xs">
                    {tool.name}
                    {tool.requiresApproval && (
                      <Shield className="ml-1 h-3 w-3 text-primary" />
                    )}
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
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "gradient-auth0 text-primary-foreground"
                      : "glass-panel"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
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
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="gradient-auth0 rounded-xl px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
