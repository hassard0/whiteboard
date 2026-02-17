import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TokenVaultFlow } from "./TokenVaultFlow";
import { AuthExplainer } from "./AuthExplainer";

export interface ToolCallDisplay {
  id: string;
  toolName: string;
  toolDescription: string;
  scopes: string[];
  status: "pending" | "approved" | "denied" | "completed" | "running";
  requiresApproval: boolean;
  auth0Feature?: string;
  result?: string;
  timestamp: Date;
  showTokenVault?: boolean;
}

interface ToolCallCardProps {
  toolCall: ToolCallDisplay;
}

const statusConfig = {
  pending: { icon: Clock, label: "Awaiting Approval", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" },
  running: { icon: Clock, label: "Running", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
  approved: { icon: Check, label: "Approved", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  denied: { icon: X, label: "Denied", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  completed: { icon: Check, label: "Completed", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
};

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(true);
  const config = statusConfig[toolCall.status];
  const StatusIcon = config.icon;

  // Determine which Auth0 feature to highlight
  const auth0Feature = toolCall.requiresApproval ? "Async Authorization" : "Fine-Grained Authorization";
  const hasTokenVault = toolCall.scopes.some(s =>
    s.includes("write") || s.includes("send") || s.includes("charge") || s.includes("execute")
  );
  const auth0Explanation = toolCall.requiresApproval
    ? "This action required explicit human approval before execution. The agent cannot perform sensitive actions without your consent."
    : `This action was automatically authorized because your token includes the required scopes: ${toolCall.scopes.join(", ")}.`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-3 text-sm ${config.bg} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {toolCall.requiresApproval && (
            <Shield className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="font-medium text-foreground">{toolCall.toolName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`text-xs ${config.color} border-current/30`}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-3 overflow-hidden"
          >
            <p className="text-xs text-muted-foreground">{toolCall.toolDescription}</p>

            {/* Auth0 Explainer */}
            <AuthExplainer
              feature={auth0Feature}
              explanation={auth0Explanation}
              scopes={toolCall.scopes}
              decision={toolCall.status === "denied" ? "denied" : toolCall.status === "pending" ? "pending" : "allowed"}
            />

            {/* Token Vault Flow for completed tool calls that involve write/sensitive ops */}
            {hasTokenVault && (toolCall.status === "completed" || toolCall.status === "approved") && (
              <TokenVaultFlow
                toolName={toolCall.toolName}
                provider="External API"
                isVisible
              />
            )}

            {/* Result */}
            {toolCall.result && (
              <pre className="rounded-md border border-border bg-secondary/50 p-2.5 text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                {toolCall.result}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
