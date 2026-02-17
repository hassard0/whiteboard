import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Shield, Bot, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import auth0Shield from "@/assets/auth0-shield.png";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Purple gradient glow — matches auth0.com hero */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[700px] w-[900px] rounded-full gradient-hero opacity-80" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex max-w-lg flex-col items-center text-center"
      >
        {/* Auth0 brand mark */}
        <div className="mb-8 flex items-center gap-3">
          <img src={auth0Shield} alt="Auth0" className="h-10 w-10 invert" />
          <span className="text-2xl font-bold tracking-tight text-foreground">Auth0 AI Demos</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
          Secure AI agents, humans,{" "}
          <span className="text-gradient-auth0">and whatever comes next</span>
        </h1>

        <p className="mb-8 max-w-md text-lg text-muted-foreground">
          Experience how Auth0 secures AI agents with approval gates, delegated access, and identity-driven authorization.
        </p>

        <Button
          size="lg"
          onClick={() => loginWithRedirect()}
          className="gradient-auth0 glow-purple h-12 px-8 text-base font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Start building for free
        </Button>

        {/* Feature badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {[
            { icon: Shield, label: "Token Vault" },
            { icon: Bot, label: "AI Agents" },
            { icon: Zap, label: "Async Auth" },
            { icon: Lock, label: "Fine-Grained Auth" },
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