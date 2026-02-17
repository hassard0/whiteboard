import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { DEMO_TEMPLATES } from "@/lib/demo-templates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth0ProfileSync } from "@/hooks/use-auth0-profile-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plane, Briefcase, ShoppingBag, Code, Wrench, Shield, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import auth0Shield from "@/assets/auth0-shield.png";

const iconMap: Record<string, React.ElementType> = {
  Plane, Briefcase, ShoppingBag, Code, Wrench,
};

export default function Dashboard() {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  useAuth0ProfileSync();

  // Load custom demos from DB
  const [customDemos, setCustomDemos] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.sub) return;
    (async () => {
      const { data } = await supabase
        .from("demo_environments")
        .select("*")
        .eq("auth0_sub", user.sub)
        .eq("env_type", "custom");
      if (data) setCustomDemos(data);
    })();
  }, [user?.sub]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src={auth0Shield} alt="Auth0" className="h-8 w-8 invert" />
            <span className="text-lg font-bold tracking-tight text-foreground">Auth0 AI Demos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Hero gradient */}
      <div className="pointer-events-none absolute left-0 right-0 top-16 h-64 gradient-hero opacity-40" />

      {/* Main */}
      <main className="relative mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <Badge variant="outline" className="mb-3 text-xs border-primary/40 text-primary">
              NEW — Auth0 for AI Agents
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Demo Launcher</h1>
            <p className="mt-2 text-muted-foreground">
              Choose a demo to experience Auth0-secured AI agents in action.
            </p>
          </div>
          <Button onClick={() => navigate("/wizard")} className="gradient-auth0 text-primary-foreground">
            <Plus className="mr-1.5 h-4 w-4" /> Create Demo
          </Button>
        </div>

        {/* Custom demos */}
        {customDemos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Your Custom Demos
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {customDemos.map((demo, i) => {
                const cfg = demo.config_overrides as any;
                if (!cfg?.wizard) return null;
                return (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <Card
                      className="group cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                      onClick={() => navigate(`/demo/${demo.template_id}`, { state: { customDemo: cfg } })}
                    >
                      <CardHeader>
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${cfg.color || "hsl(262 83% 58%)"}15` }}>
                          <Sparkles className="h-6 w-6" style={{ color: cfg.color || "hsl(262 83% 58%)" }} />
                        </div>
                        <CardTitle className="text-lg">{cfg.name}</CardTitle>
                        <CardDescription>{cfg.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {(cfg.auth0Features || []).map((f: any) => (
                            <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
                          ))}
                        </div>
                        <div className="mt-4">
                          <Button size="sm" className="gradient-auth0 text-primary-foreground text-xs">
                            Launch Demo
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pre-built templates */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Pre-Built Templates</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_TEMPLATES.map((template, i) => {
            const Icon = iconMap[template.icon] || Wrench;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card
                  className="group cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => navigate(`/demo/${template.id}`)}
                >
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${template.color}20` }}>
                      <Icon className="h-6 w-6" style={{ color: template.color }} />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.auth0Features.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-xs">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/builder/${template.id}`); }}
                      >
                        <Wrench className="mr-1 h-3 w-3" /> Configure
                      </Button>
                      <Button
                        size="sm"
                        className="gradient-auth0 text-primary-foreground text-xs"
                        onClick={(e) => { e.stopPropagation(); navigate(`/demo/${template.id}`); }}
                      >
                        Launch Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}