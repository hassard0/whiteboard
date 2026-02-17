import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Shield, Bot, Database, Globe, Key, UserCheck, ArrowRight, Cpu, Lock } from "lucide-react";

interface ArchitectureShelfProps {
  templateName: string;
  activeFeatures: string[];
  lastToolCall?: string;
  /** Which architecture node to highlight as the current stage */
  activeStage?: "user" | "auth0" | "agent" | "tools" | "vault" | "data";
}

export function ArchitectureShelf({ templateName, activeFeatures, lastToolCall, activeStage }: ArchitectureShelfProps) {
  const [expanded, setExpanded] = useState(false);

  const nodes = [
    {
      id: "user",
      label: "User",
      sublabel: "Browser Session",
      icon: UserCheck,
      color: "text-foreground",
      bg: "bg-secondary",
    },
    {
      id: "auth0",
      label: "Auth0",
      sublabel: "Identity Provider",
      icon: Shield,
      color: "text-primary",
      bg: "bg-primary/10",
      highlight: true,
    },
    {
      id: "agent",
      label: "AI Agent",
      sublabel: "Gemini via Lovable AI",
      icon: Bot,
      color: "text-auth0-teal",
      bg: "bg-auth0-teal/10",
    },
    {
      id: "tools",
      label: "Tool Execution",
      sublabel: "Mock Provider APIs",
      icon: Cpu,
      color: "text-auth0-violet",
      bg: "bg-auth0-violet/10",
      active: !!lastToolCall,
    },
    {
      id: "vault",
      label: "Token Vault",
      sublabel: "Credential Delegation",
      icon: Lock,
      color: "text-primary",
      bg: "bg-primary/10",
      highlight: activeFeatures.includes("Token Vault"),
    },
    {
      id: "data",
      label: "Data Store",
      sublabel: "Isolated per Environment",
      icon: Database,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ];

  const connections = [
    { from: "user", to: "auth0", label: "Login / Consent", protocol: "OAuth 2.0 + PKCE" },
    { from: "auth0", to: "agent", label: "Scoped Token", protocol: "JWT with FGA claims" },
    { from: "agent", to: "tools", label: "Tool Call", protocol: "Function Calling" },
    { from: "tools", to: "vault", label: "Token Exchange", protocol: "RFC 8693" },
    { from: "vault", to: "data", label: "Delegated Access", protocol: "Scoped Bearer Token" },
  ];

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur-sm">
      {/* Toggle bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground">Architecture</span>
          <span className="text-muted-foreground">— How it all connects</span>
          {lastToolCall && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary animate-pulse">
              Active: {lastToolCall}
            </Badge>
          )}
        </div>
        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              {/* Flow diagram */}
              <div className="rounded-xl border border-border bg-background/50 p-4">
                {/* Horizontal node flow */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-3">
                  {nodes.map((node, i) => {
                    const Icon = node.icon;
                    return (
                      <div key={node.id} className="flex items-center gap-2 shrink-0">
                        <motion.div
                          className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 min-w-[100px] transition-all ${
                            activeStage === node.id
                              ? "border-primary ring-2 ring-primary/30 shadow-md shadow-primary/20"
                              : node.highlight
                              ? "border-primary/40 shadow-sm shadow-primary/10"
                              : node.active
                              ? "border-auth0-violet/40"
                              : "border-border"
                          } ${node.bg}`}
                          animate={activeStage === node.id ? { scale: [1, 1.04, 1] } : node.active ? { scale: [1, 1.02, 1] } : {}}
                          transition={{ repeat: (activeStage === node.id || node.active) ? Infinity : 0, duration: 2 }}
                        >
                          <Icon className={`h-5 w-5 ${activeStage === node.id ? "text-primary" : node.color}`} />
                          <span className={`text-[11px] font-semibold ${activeStage === node.id ? "text-primary" : "text-foreground"}`}>{node.label}</span>
                          <span className="text-[9px] text-muted-foreground text-center leading-tight">{node.sublabel}</span>
                        </motion.div>
                        {i < nodes.length - 1 && (
                          <div className="flex flex-col items-center gap-0.5 px-1">
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Connection details */}
                <div className="mt-3 grid grid-cols-5 gap-2 border-t border-border pt-3">
                  {connections.map((conn) => (
                    <div key={`${conn.from}-${conn.to}`} className="text-center space-y-0.5">
                      <span className="text-[10px] font-medium text-foreground block">{conn.label}</span>
                      <span className="text-[9px] text-muted-foreground font-mono block">{conn.protocol}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active features */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Active Auth0 features:</span>
                {activeFeatures.map((f) => (
                  <Badge key={f} variant="outline" className="text-[9px] h-5 px-1.5 border-primary/30 text-primary">
                    <Shield className="mr-0.5 h-2.5 w-2.5" />
                    {f}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}