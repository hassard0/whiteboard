import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Shield, Bot, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";
import auth0Logo from "@/assets/auth0-logo-full-white.png";

export function LoginPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <img src={auth0Logo} alt="Auth0 by Okta" className="h-7" />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loginWithRedirect()}
            className="rounded-full border-border bg-transparent text-foreground hover:bg-secondary"
          >
            Login
          </Button>
        </div>
      </header>

      {/* Purple/indigo gradient blob — matches auth0.com */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[1200px] h-[800px]"
          style={{
            background: "radial-gradient(ellipse at 50% 30%, hsl(262 80% 50% / 0.45) 0%, hsl(240 60% 45% / 0.25) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="flex flex-col items-center text-center max-w-2xl"
        >
          {/* NEW pill */}
          <div className="mb-8 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2 backdrop-blur-sm">
            <span className="rounded-md bg-foreground px-2 py-0.5 text-[11px] font-bold tracking-wide text-background">
              NEW
            </span>
            <span className="text-sm text-muted-foreground">Auth0 for AI Agents</span>
            <span className="text-sm text-muted-foreground">→</span>
          </div>

          <h1 className="text-5xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Secure AI agents, humans, and whatever comes next
          </h1>

          <p className="mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
            Experience how Auth0 secures AI agents with approval gates, delegated access, and identity-driven authorization.
          </p>

          {/* CTA button */}
          <div className="mt-10 flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => loginWithRedirect()}
              className="h-12 rounded-full bg-foreground px-8 text-base font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              Login to demo
            </Button>
          </div>
        </motion.div>

        {/* Feature badges — bottom of hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 flex flex-wrap justify-center gap-3"
        >
          {[
            { icon: Shield, label: "Token Vault" },
            { icon: Bot, label: "AI Agents" },
            { icon: Zap, label: "Async Auth" },
            { icon: Lock, label: "Fine-Grained Auth" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <Icon className="h-4 w-4 text-primary" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
