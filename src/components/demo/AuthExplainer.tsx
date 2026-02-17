import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Info } from "lucide-react";
import { motion } from "framer-motion";

interface AuthExplainerProps {
  feature: string;
  explanation: string;
  scopes: string[];
  decision: "allowed" | "denied" | "pending";
}

const decisionConfig = {
  allowed: { icon: Check, color: "text-green-400", bg: "border-green-400/20 bg-green-400/5", label: "Allowed" },
  denied: { icon: X, color: "text-destructive", bg: "border-destructive/20 bg-destructive/5", label: "Denied" },
  pending: { icon: Info, color: "text-yellow-400", bg: "border-yellow-400/20 bg-yellow-400/5", label: "Pending" },
};

export function AuthExplainer({ feature, explanation, scopes, decision }: AuthExplainerProps) {
  const config = decisionConfig[decision];
  const DecisionIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border p-3 ${config.bg}`}
    >
      <div className="flex items-start gap-2">
        <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">{feature}</span>
            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${config.color} border-current/30`}>
              <DecisionIcon className="mr-0.5 h-2.5 w-2.5" />
              {config.label}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{explanation}</p>
          <div className="flex flex-wrap gap-1">
            {scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-[9px] font-mono h-4 px-1.5">
                {scope}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
