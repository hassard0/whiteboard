import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { DEMO_TEMPLATES } from "@/lib/demo-templates";
import { generateEnvId } from "@/lib/demo-templates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth0ProfileSync } from "@/hooks/use-auth0-profile-sync";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Briefcase, ShoppingBag, Code, Wrench, Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { AIMagicModal } from "@/components/demo/AIMagicModal";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Plane, Briefcase, ShoppingBag, Code, Wrench,
};

export default function Dashboard() {
  const { user } = useAuth0();
  const navigate = useNavigate();
  useAuth0ProfileSync();

  const [customDemos, setCustomDemos] = useState<any[]>([]);
  const [magicOpen, setMagicOpen] = useState(false);

  const loadCustomDemos = useCallback(async () => {
    if (!user?.sub) return;
    const { data } = await supabase
      .from("demo_environments")
      .select("*")
      .eq("auth0_sub", user.sub)
      .eq("env_type", "custom");
    if (data) setCustomDemos(data);
  }, [user?.sub]);

  useEffect(() => { loadCustomDemos(); }, [loadCustomDemos]);

  const handleAIGenerated = async (config: any) => {
    if (!user?.sub) return;
    // Pick first available template as base, or generic
    const baseTemplateId = "generic-agent";
    const envId = generateEnvId(user.sub, `custom-${Date.now()}`);
    try {
      const { error } = await supabase.from("demo_environments").insert({
        env_id: envId,
        auth0_sub: user.sub,
        template_id: baseTemplateId,
        env_type: "custom",
        config_overrides: config as any,
      });
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      toast.success(`"${config.name}" demo created!`);
      await loadCustomDemos();
    } catch (e: any) {
      console.error("handleAIGenerated error:", e);
      toast.error("Failed to save demo: " + (e.message || e.details || JSON.stringify(e)));
    }
  };

  return (
    <DashboardLayout>
      {/* Hero gradient */}
      <div className="pointer-events-none absolute left-0 right-0 top-16 h-72 z-0" style={{
        background: "radial-gradient(ellipse at 50% 0%, hsl(262 80% 50% / 0.2) 0%, hsl(240 60% 45% / 0.1) 50%, transparent 80%)",
      }} />

      <AIMagicModal
        open={magicOpen}
        onClose={() => setMagicOpen(false)}
        onGenerated={handleAIGenerated}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-md bg-foreground px-2 py-0.5 text-[10px] font-bold tracking-wide text-background">
                NEW
              </span>
              <span className="text-sm text-muted-foreground">Auth0 for AI Agents</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Demo Launcher</h1>
            <p className="mt-2 text-muted-foreground">
              Choose a demo to experience Auth0-secured AI agents in action.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Magic Button */}
            <motion.button
              onClick={() => setMagicOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 transition-all hover:bg-primary/20 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20"
              title="Generate demo with AI"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <Sparkles className="h-4.5 w-4.5 text-primary relative z-10" />
            </motion.button>
            <Button
              onClick={() => navigate("/wizard")}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-6"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Create Demo
            </Button>
          </div>
        </div>

        {/* Custom demos */}
        {customDemos.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Your Custom Demos
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {customDemos.map((demo, i) => {
                const cfg = demo.config_overrides as any;
                if (!cfg?.wizard) return null;
                return (
                  <motion.div
                    key={demo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex"
                  >
                    <Card
                      className="group flex flex-col w-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                      onClick={() => navigate(`/demo/${demo.template_id}`, { state: { customDemo: cfg } })}
                    >
                      <CardHeader>
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden" style={{ backgroundColor: `${cfg.color || "hsl(262 83% 58%)"}15` }}>
                            {cfg.customerLogo ? (
                              <img
                                src={cfg.customerLogo}
                                alt={cfg.customerName || cfg.name}
                                className="h-8 w-8 object-contain"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                              />
                            ) : (
                              <Sparkles className="h-6 w-6" style={{ color: cfg.color || "hsl(262 83% 58%)" }} />
                            )}
                          </div>
                          {cfg.customerName && (
                            <span className="text-xs text-muted-foreground font-medium">{cfg.customerName}</span>
                          )}
                        </div>
                        <CardTitle className="text-lg">{cfg.name}</CardTitle>
                        <CardDescription>{cfg.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col flex-1">
                        <div className="flex flex-wrap gap-2">
                          {(cfg.auth0Features || []).map((f: any) => (
                            <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
                          ))}
                        </div>
                        <div className="mt-auto pt-4">
                          <Button size="sm" className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {DEMO_TEMPLATES.map((template, i) => {
            const Icon = iconMap[template.icon] || Wrench;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex"
              >
                <Card
                  className="group flex flex-col w-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                  onClick={() => navigate(`/demo/${template.id}`)}
                >
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${template.color}20` }}>
                      <Icon className="h-6 w-6" style={{ color: template.color }} />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2">
                      {template.auth0Features.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-xs">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-auto pt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs border-border/60"
                        onClick={(e) => { e.stopPropagation(); navigate(`/builder/${template.id}`); }}
                      >
                        <Wrench className="mr-1 h-3 w-3" /> Configure
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4"
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
    </DashboardLayout>
  );
}
