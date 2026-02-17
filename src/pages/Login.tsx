import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Shield, Bot, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Glow effect */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
      >
        {/* Auth0 Logo placeholder */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-auth0">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Auth0 AI Demos</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Identity is the{" "}
          <span className="text-gradient-auth0">control plane</span>
          {" "}for AI
        </h1>

        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Experience how Auth0 secures AI agents with approval gates, delegated access, and identity-driven authorization.
        </p>

        <Button
          size="lg"
          onClick={() => loginWithRedirect()}
          className="gradient-auth0 glow-orange h-12 px-8 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Sign in with Auth0
        </Button>

        {/* Feature badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {[
            { icon: Shield, label: "Token Vault" },
            { icon: Bot, label: "AI Agents" },
            { icon: Zap, label: "Async Auth" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
