import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Clock, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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

// Render a JSON value nicely — arrays become rows, objects become key/value pairs
function ResultValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground/60 italic">—</span>;
  if (typeof value === "boolean") return <span className={value ? "text-green-400" : "text-destructive"}>{value ? "Yes" : "No"}</span>;
  if (typeof value === "number") return <span className="text-primary font-mono">{value}</span>;
  if (typeof value === "string") return <span className="text-foreground/90">{value}</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground/60 italic">empty</span>;
    // Array of objects → table-like rows
    if (typeof value[0] === "object" && value[0] !== null) {
      const keys = Object.keys(value[0]);
      return (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                {keys.map((k) => (
                  <th key={k} className="text-left px-2 py-1 border-b border-border text-muted-foreground font-medium capitalize">
                    {k.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((row: any, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  {keys.map((k) => (
                    <td key={k} className="px-2 py-1.5 text-foreground/85">
                      <ResultValue value={row[k]} depth={depth + 1} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    // Array of primitives → badges
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-foreground/80">{String(v)}</span>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (depth > 0) {
      // Nested object — inline
      return (
        <div className="space-y-0.5">
          {entries.map(([k, v]) => (
            <div key={k} className="flex items-start gap-1.5">
              <span className="text-muted-foreground capitalize shrink-0">{k.replace(/_/g, " ")}:</span>
              <ResultValue value={v} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-start gap-2">
            <span className="text-muted-foreground text-[11px] capitalize min-w-[100px] shrink-0">{k.replace(/_/g, " ")}</span>
            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 mt-0.5 shrink-0" />
            <div className="text-[11px] min-w-0">
              <ResultValue value={v} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span className="text-foreground/80 font-mono text-[11px]">{JSON.stringify(value)}</span>;
}

function StructuredResult({ raw }: { raw: string }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Not JSON — render as text
    return (
      <pre className="rounded-md border border-border bg-secondary/40 p-2.5 text-[11px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
        {raw}
      </pre>
    );
  }

  return (
    <div className="rounded-md border border-border bg-secondary/30 px-3 py-2.5">
      <ResultValue value={parsed} />
    </div>
  );
}

export function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[toolCall.status];
  const StatusIcon = config.icon;

  const auth0Feature = toolCall.requiresApproval ? "Async Authorization" : "Fine-Grained Authorization";
  const hasTokenVault = toolCall.scopes.some((s) =>
    s.includes("write") || s.includes("send") || s.includes("charge") || s.includes("execute")
  );
  const auth0Explanation = toolCall.requiresApproval
    ? "This action required explicit human approval before execution. The agent cannot perform sensitive actions without your consent."
    : `Automatically authorized via scopes: ${toolCall.scopes.join(", ")}.`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border p-3 text-sm ${config.bg} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {toolCall.requiresApproval && <Shield className="h-3.5 w-3.5 text-primary" />}
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

            {/* Token Vault Flow */}
            {hasTokenVault && (toolCall.status === "completed" || toolCall.status === "approved") && (
              <TokenVaultFlow toolName={toolCall.toolName} provider="External API" isVisible />
            )}

            {/* Structured Result */}
            {toolCall.result && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Result</p>
                <StructuredResult raw={toolCall.result} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
