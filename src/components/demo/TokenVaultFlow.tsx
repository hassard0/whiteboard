import { motion } from "framer-motion";
import { Shield, ArrowRight, Lock, Server, Globe } from "lucide-react";

interface TokenVaultFlowProps {
  toolName: string;
  provider?: string;
  isVisible: boolean;
}

const steps = [
  { icon: Globe, label: "User", sublabel: "Identity verified", color: "text-foreground" },
  { icon: Shield, label: "Auth0", sublabel: "Token exchange", color: "text-primary" },
  { icon: Lock, label: "Token Vault", sublabel: "Credentials secured", color: "text-primary" },
  { icon: Server, label: "Provider", sublabel: "API accessed", color: "text-green-400" },
];

export function TokenVaultFlow({ toolName, provider, isVisible }: TokenVaultFlowProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl border border-primary/20 bg-primary/5 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Token Vault — Delegated Access</span>
      </div>

      <div className="flex items-center justify-between gap-1">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const sublabel = i === 3 && provider ? provider : step.sublabel;
          return (
            <div key={step.label} className="flex items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 300 }}
                className="flex flex-col items-center gap-1"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card ${step.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-medium text-foreground">{step.label}</span>
                <span className="text-[9px] text-muted-foreground">{sublabel}</span>
              </motion.div>
              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 + 0.1 }}
                  className="mb-5"
                >
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-muted-foreground leading-relaxed">
        Your credentials are never exposed to the AI agent. Auth0 Token Vault securely delegates access
        to <span className="text-primary font-medium">{toolName}</span> using scoped, time-limited tokens.
      </p>
    </motion.div>
  );
}
