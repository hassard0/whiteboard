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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plane, Briefcase, ShoppingBag, Code, Wrench, Plus, Sparkles, Pencil, Trash2, AlertTriangle, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { AIMagicModal } from "@/components/demo/AIMagicModal";
import { EditDemoModal } from "@/components/demo/EditDemoModal";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  Plane, Briefcase, ShoppingBag, Code, Wrench,
};

type FilterTab = "all" | "prebuilt" | "mine" | "public";

export default function Dashboard() {
  const { user } = useAuth0();
  const navigate = useNavigate();
  useAuth0ProfileSync();

  const [customDemos, setCustomDemos] = useState<any[]>([]);
  const [publicDemos, setPublicDemos] = useState<any[]>([]);
  const [magicOpen, setMagicOpen] = useState(false);
  const [editDemo, setEditDemo] = useState<any | null>(null);
  const [deleteDemo, setDeleteDemo] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loadCustomDemos = useCallback(async () => {
    if (!user?.sub) return;
    const { data } = await supabase
      .from("demo_environments")
      .select("*")
      .eq("auth0_sub", user.sub)
      .eq("env_type", "custom")
      .order("created_at", { ascending: false });
    if (data) setCustomDemos(data);
  }, [user?.sub]);

  const loadPublicDemos = useCallback(async () => {
    const { data } = await supabase
      .from("demo_environments")
      .select("*, profiles(name, email)")
      .eq("env_type", "custom")
      .order("created_at", { ascending: false });
    if (data) {
      // Filter to only public ones (is_public === true or not set yet = treated as public by default)
      setPublicDemos(data.filter((d: any) => {
        const cfg = d.config_overrides as any;
        return cfg?.wizard && (cfg?.isPublic !== false);
      }));
    }
  }, []);

  useEffect(() => { loadCustomDemos(); }, [loadCustomDemos]);
  useEffect(() => { loadPublicDemos(); }, [loadPublicDemos]);


  const handleAIGenerated = async (config: any) => {
    if (!user?.sub) return;
    const baseTemplateId = "generic-agent";
    const envId = generateEnvId(user.sub, `custom-${Date.now()}`);
    try {
      const { error } = await supabase.from("demo_environments").insert({
        env_id: envId,
        auth0_sub: user.sub,
        template_id: baseTemplateId,
        env_type: "custom",
        config_overrides: { ...config, isPublic: config.isPublic !== false } as any,
      });
      if (error) throw error;
      toast.success(`"${config.name}" demo created!`);
      await loadCustomDemos();
      await loadPublicDemos();
      setActiveTab("mine");
    } catch (e: any) {
      toast.error("Failed to save demo: " + (e.message || e.details || JSON.stringify(e)));
    }
  };

  const handleSaveEdit = async (id: string, newConfig: any) => {
    const { error } = await supabase
      .from("demo_environments")
      .update({ config_overrides: newConfig })
      .eq("id", id);
    if (error) throw new Error(error.message);
    toast.success("Demo updated!");
    setEditDemo(null);
    await loadCustomDemos();
    await loadPublicDemos();
  };

  const handleEditClick = (demo: any) => {
    navigate(`/wizard/edit/${demo.id}`);
  };

  const handleDelete = async () => {
    if (!deleteDemo) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("demo_environments")
        .delete()
        .eq("id", deleteDemo.id);
      if (error) throw error;
      toast.success("Demo deleted.");
      setDeleteDemo(null);
      await loadCustomDemos();
      await loadPublicDemos();
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const FILTER_TABS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "prebuilt", label: "Pre-built Templates" },
    { id: "mine", label: "Made by Me" },
    { id: "public", label: "All Public Demos" },
  ];

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

      <EditDemoModal
        open={!!editDemo}
        demo={editDemo}
        onClose={() => setEditDemo(null)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteDemo} onOpenChange={(o) => !o && setDeleteDemo(null)}>
        <DialogContent className="sm:max-w-sm border-border/60 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Delete Demo
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <span className="font-medium text-foreground">"{(deleteDemo?.config_overrides as any)?.name}"</span>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDemo(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="rounded-full">
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
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

        {/* Filter Tabs */}
        <div className="mb-8 flex items-center gap-1 rounded-lg border border-border/50 bg-card/30 p-1 w-fit">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.id === "mine" && customDemos.length > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  activeTab === "mine" ? "bg-background/20 text-background" : "bg-secondary text-muted-foreground"
                }`}>
                  {customDemos.filter((d: any) => d.config_overrides?.wizard).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pre-built Templates Tab */}
        {(activeTab === "prebuilt" || activeTab === "all") && (
          <div className={activeTab === "all" ? "mb-10" : ""}>
            {activeTab === "all" && (
              <h2 className="text-lg font-semibold text-foreground mb-4">Pre-Built Templates</h2>
            )}
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
                            <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
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
          </div>
        )}

        {/* Made by Me Tab */}
        {(activeTab === "mine" || activeTab === "all") && (
          <div className={activeTab === "all" ? "mb-10" : ""}>
            {activeTab === "all" && customDemos.filter((d: any) => d.config_overrides?.wizard).length > 0 && (
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Your Custom Demos
              </h2>
            )}
            {activeTab !== "all" && customDemos.filter((d: any) => d.config_overrides?.wizard).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No custom demos yet</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                  Create your first custom demo using the wizard or AI generator.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setMagicOpen(true)} className="rounded-full">
                    <Sparkles className="mr-1.5 h-4 w-4" /> AI Generate
                  </Button>
                  <Button onClick={() => navigate("/wizard")} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                    <Plus className="mr-1.5 h-4 w-4" /> Create Demo
                  </Button>
                </div>
              </div>
            ) : (
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
                      <Card className="group flex flex-col w-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                        <CardHeader>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: `${cfg.color || "hsl(262 83% 58%)"}15` }}>
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
                            <div className="flex items-center gap-1">
                              {/* Visibility badge */}
                              <span className={`flex items-center gap-0.5 text-[9px] font-medium rounded-full px-1.5 py-0.5 ${
                                cfg.isPublic !== false
                                  ? "bg-accent/20 text-accent-foreground"
                                  : "bg-secondary text-muted-foreground"
                              }`}>
                                {cfg.isPublic !== false ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                                {cfg.isPublic !== false ? "Public" : "Private"}
                              </span>
                              {/* Edit / Delete — visible on hover */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(demo); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                                  title="Edit demo"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteDemo(demo); }}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Delete demo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <CardTitle
                            className="text-lg cursor-pointer"
                            onClick={() => navigate(`/demo/${demo.template_id}`, { state: { customDemo: cfg } })}
                          >
                            {cfg.name}
                          </CardTitle>
                          <CardDescription>{cfg.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-1">
                          <div className="flex flex-wrap gap-2">
                            {(cfg.auth0Features || []).map((f: any) => (
                              <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
                            ))}
                          </div>
                          <div className="mt-auto pt-4 flex items-end justify-between">
                            <Button
                              size="sm"
                              className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4"
                              onClick={() => navigate(`/demo/${demo.template_id}`, { state: { customDemo: cfg } })}
                            >
                              Launch Demo
                            </Button>
                            <span className="text-[10px] text-muted-foreground/60">
                              Created by: <span className="font-medium">{user?.name || user?.email || "You"}</span>
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* All Public Demos Tab */}
        {(activeTab === "public" || activeTab === "all") && (
          <PublicDemosSection
            demos={activeTab === "all" ? publicDemos.filter((d: any) => d.auth0_sub !== user?.sub) : publicDemos}
            activeTab={activeTab}
            currentUserId={user?.sub}
            onEdit={handleEditClick}
            onDelete={(demo) => setDeleteDemo(demo)}
            onLaunch={(demo) => navigate(`/demo/${demo.template_id}`, { state: { customDemo: demo.config_overrides } })}
          />
        )}
      </main>
    </DashboardLayout>
  );
}

// ── PublicDemosSection ────────────────────────────────────────────────────────
function PublicDemosSection({
  demos,
  activeTab,
  currentUserId,
  onEdit,
  onDelete,
  onLaunch,
}: {
  demos: any[];
  activeTab: string;
  currentUserId?: string;
  onEdit: (demo: any) => void;
  onDelete: (demo: any) => void;
  onLaunch: (demo: any) => void;
}) {
  return (
    <div>
      {activeTab === "all" && demos.length > 0 && (
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" /> All Public Demos
        </h2>
      )}
      {demos.length === 0 && activeTab !== "all" ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Globe className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No public demos yet</h3>
          <p className="text-muted-foreground text-sm">Be the first to create a public custom demo.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
          {demos.map((demo, i) => {
            const cfg = demo.config_overrides as any;
            const isOwner = demo.auth0_sub === currentUserId;
            return (
              <motion.div
                key={demo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="flex"
              >
                <Card className="group flex flex-col w-full border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                  <CardHeader>
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: `${cfg.color || "hsl(262 83% 58%)"}15` }}>
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
                      {isOwner && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); onEdit(demo); }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                            title="Edit demo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelete(demo); }}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Delete demo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <CardTitle
                      className="text-lg cursor-pointer"
                      onClick={() => onLaunch(demo)}
                    >
                      {cfg.name}
                    </CardTitle>
                    <CardDescription>{cfg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <div className="flex flex-wrap gap-2">
                      {(cfg.auth0Features || []).map((f: any) => (
                        <Badge key={f.id} variant="secondary" className="text-xs">{f.name}</Badge>
                      ))}
                    </div>
                    <div className="mt-auto pt-4 flex items-end justify-between">
                      <Button
                        size="sm"
                        className="rounded-full bg-foreground text-background hover:bg-foreground/90 text-xs px-4"
                        onClick={() => onLaunch(demo)}
                      >
                        Launch Demo
                      </Button>
                      <span className="text-[10px] text-muted-foreground/60">
                        Created by: <span className="font-medium">{(demo.profiles as any)?.name || (demo.profiles as any)?.email || "Unknown"}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
