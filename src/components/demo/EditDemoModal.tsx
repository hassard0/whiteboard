import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Plus, Trash2, Shield, UserCheck, Key, Lock, FileText, User, ArrowRightLeft } from "lucide-react";
import { TOOL_LIBRARY, AUTH0_FEATURE_LIBRARY, INDUSTRY_GROUPS, type ToolDef, type Auth0FeatureDef } from "@/lib/tool-library";
import { cn } from "@/lib/utils";

interface EditDemoModalProps {
  open: boolean;
  demo: any | null;
  onClose: () => void;
  onSave: (id: string, newConfig: any) => Promise<void>;
}

const FEATURE_ICON_MAP: Record<string, React.ElementType> = {
  Shield, UserCheck, Key, Lock, FileText, User, ArrowRightLeft,
};

const HSL_PRESETS = [
  "hsl(262 83% 58%)",
  "hsl(214 100% 34%)",
  "hsl(174 62% 47%)",
  "hsl(142 60% 45%)",
  "hsl(45 90% 55%)",
  "hsl(0 75% 55%)",
  "hsl(20 90% 55%)",
  "hsl(300 60% 50%)",
  "hsl(195 80% 45%)",
  "hsl(330 70% 55%)",
];

export function EditDemoModal({ open, demo, onClose, onSave }: EditDemoModalProps) {
  const cfg = demo?.config_overrides as any;

  // --- Form state ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [color, setColor] = useState("hsl(262 83% 58%)");
  const [knowledgePack, setKnowledgePack] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [toolOverrides, setToolOverrides] = useState<Record<string, { requiresApproval: boolean; description: string }>>({});
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [featureDescOverrides, setFeatureDescOverrides] = useState<Record<string, string>>({});
  const [systemPromptParts, setSystemPromptParts] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  // Sync state when demo changes
  useEffect(() => {
    if (!cfg) return;
    setName(cfg.name || "");
    setDescription(cfg.description || "");
    setCustomerName(cfg.customerName || "");
    setColor(cfg.color || "hsl(262 83% 58%)");
    setKnowledgePack(cfg.knowledgePack || "");
    setSystemPromptParts(cfg.systemPromptParts?.length ? cfg.systemPromptParts : [""]);

    // Build selected tools
    const toolIds = new Set<string>((cfg.tools || []).map((t: any) => t.id));
    setSelectedToolIds(toolIds);
    const overrides: Record<string, { requiresApproval: boolean; description: string }> = {};
    for (const t of (cfg.tools || [])) {
      overrides[t.id] = { requiresApproval: t.requiresApproval, description: t.description };
    }
    setToolOverrides(overrides);

    // Build selected features
    const featureIds = new Set<string>((cfg.auth0Features || []).map((f: any) => f.id));
    setSelectedFeatureIds(featureIds);
    const fOverrides: Record<string, string> = {};
    for (const f of (cfg.auth0Features || [])) {
      fOverrides[f.id] = f.description;
    }
    setFeatureDescOverrides(fOverrides);
  }, [demo]);

  const toggleTool = (toolId: string) => {
    setSelectedToolIds((prev) => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
        // Initialize override from library if not present
        if (!toolOverrides[toolId]) {
          const lib = TOOL_LIBRARY.find((t) => t.id === toolId);
          if (lib) {
            setToolOverrides((o) => ({ ...o, [toolId]: { requiresApproval: lib.requiresApproval, description: lib.description } }));
          }
        }
      }
      return next;
    });
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatureIds((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
        if (!featureDescOverrides[featureId]) {
          const lib = AUTH0_FEATURE_LIBRARY.find((f) => f.id === featureId);
          if (lib) setFeatureDescOverrides((o) => ({ ...o, [featureId]: lib.description }));
        }
      }
      return next;
    });
  };

  const updatePromptPart = (i: number, val: string) => {
    setSystemPromptParts((prev) => prev.map((p, idx) => (idx === i ? val : p)));
  };
  const addPromptPart = () => setSystemPromptParts((p) => [...p, ""]);
  const removePromptPart = (i: number) => setSystemPromptParts((p) => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build tools array from selections
      const tools = Array.from(selectedToolIds).map((id) => {
        const lib = TOOL_LIBRARY.find((t) => t.id === id)!;
        const override = toolOverrides[id];
        return {
          ...lib,
          requiresApproval: override?.requiresApproval ?? lib.requiresApproval,
          description: override?.description || lib.description,
        };
      });

      // Build auth0Features array
      const auth0Features = Array.from(selectedFeatureIds).map((id) => {
        const lib = AUTH0_FEATURE_LIBRARY.find((f) => f.id === id)!;
        return {
          ...lib,
          description: featureDescOverrides[id] || lib.description,
        };
      });

      const newConfig = {
        ...cfg,
        name,
        description,
        customerName: customerName || undefined,
        color,
        knowledgePack,
        systemPromptParts: systemPromptParts.filter((p) => p.trim()),
        tools,
        auth0Features,
      };

      await onSave(demo.id, newConfig);
    } finally {
      setSaving(false);
    }
  };

  // Group tools by industry for rendering
  const toolsByIndustry = TOOL_LIBRARY.reduce<Record<string, ToolDef[]>>((acc, tool) => {
    if (!acc[tool.industry]) acc[tool.industry] = [];
    acc[tool.industry].push(tool);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/40">
          <DialogTitle className="text-lg font-semibold">Edit Demo</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mt-3 mb-0 grid grid-cols-4 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">
              Tools <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{selectedToolIds.size}</Badge>
            </TabsTrigger>
            <TabsTrigger value="auth0" className="text-xs">
              Auth0 <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{selectedFeatureIds.size}</Badge>
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs">Prompt</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 min-h-0">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="px-6 py-4 space-y-4 mt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Demo Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50" placeholder="e.g. IKEA Shopping Assistant" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50 resize-none min-h-[72px]" placeholder="One sentence describing what this agent does" />
                </div>
                <div className="space-y-1.5">
                  <Label>Customer / Company Name</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-secondary/50" placeholder="e.g. IKEA" />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {HSL_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                          "h-6 w-6 rounded-full border-2 transition-all",
                          color === c ? "border-foreground scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="bg-secondary/50 text-xs font-mono mt-1" placeholder="hsl(262 83% 58%)" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Knowledge Pack <span className="text-xs text-muted-foreground font-normal">(shown in demo explainer)</span></Label>
                  <Textarea value={knowledgePack} onChange={(e) => setKnowledgePack(e.target.value)} className="bg-secondary/50 resize-none min-h-[80px]" placeholder="Explain which Auth0 features are used and why they matter for this use case." />
                </div>
              </div>
            </TabsContent>

            {/* TOOLS TAB */}
            <TabsContent value="tools" className="px-6 py-4 mt-0 space-y-6">
              <p className="text-xs text-muted-foreground">Select which tools this agent can use. Toggle approval requirement per tool.</p>
              {Object.entries(toolsByIndustry).map(([industry, tools]) => (
                <div key={industry}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{INDUSTRY_GROUPS[industry] || industry}</p>
                  <div className="space-y-1.5">
                    {tools.map((tool) => {
                      const isSelected = selectedToolIds.has(tool.id);
                      const override = toolOverrides[tool.id];
                      const requiresApproval = override?.requiresApproval ?? tool.requiresApproval;
                      const desc = override?.description ?? tool.description;
                      return (
                        <div
                          key={tool.id}
                          className={cn(
                            "rounded-lg border p-3 transition-all",
                            isSelected ? "border-primary/40 bg-primary/5" : "border-border/40 bg-secondary/20"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTool(tool.id)}
                              className={cn(
                                "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all",
                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-transparent"
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{tool.name}</span>
                                {isSelected && (
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-[10px] text-muted-foreground">Needs approval</span>
                                    <Switch
                                      checked={requiresApproval}
                                      onCheckedChange={(v) =>
                                        setToolOverrides((o) => ({ ...o, [tool.id]: { ...o[tool.id], requiresApproval: v, description: desc } }))
                                      }
                                      className="h-4 w-7 data-[state=checked]:bg-primary"
                                    />
                                  </div>
                                )}
                              </div>
                              {isSelected ? (
                                <Input
                                  value={desc}
                                  onChange={(e) =>
                                    setToolOverrides((o) => ({ ...o, [tool.id]: { requiresApproval, description: e.target.value } }))
                                  }
                                  className="mt-1.5 h-7 text-xs bg-secondary/60 border-border/40"
                                />
                              ) : (
                                <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                              )}
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {tool.scopes.map((s) => (
                                  <code key={s} className="text-[10px] bg-secondary/60 px-1.5 py-0.5 rounded text-muted-foreground">{s}</code>
                                ))}
                                {isSelected && requiresApproval && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 text-amber-500 bg-amber-500/10 border-0">requires approval</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* AUTH0 FEATURES TAB */}
            <TabsContent value="auth0" className="px-6 py-4 mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">Select which Auth0 features to highlight. Customize the description to match this company's context.</p>
              {AUTH0_FEATURE_LIBRARY.map((feature) => {
                const isSelected = selectedFeatureIds.has(feature.id);
                const desc = featureDescOverrides[feature.id] ?? feature.description;
                const Icon = FEATURE_ICON_MAP[feature.icon] || Shield;
                return (
                  <div
                    key={feature.id}
                    className={cn(
                      "rounded-lg border p-3 transition-all",
                      isSelected ? "border-primary/40 bg-primary/5" : "border-border/40 bg-secondary/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleFeature(feature.id)}
                        className={cn(
                          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all",
                          isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-transparent"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </button>
                      <div className="flex items-center justify-center h-7 w-7 rounded-lg flex-shrink-0 bg-primary/10">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{feature.name}</span>
                        {isSelected ? (
                          <Textarea
                            value={desc}
                            onChange={(e) => setFeatureDescOverrides((o) => ({ ...o, [feature.id]: e.target.value }))}
                            className="mt-1.5 text-xs bg-secondary/60 border-border/40 resize-none min-h-[60px]"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            {/* PROMPT TAB */}
            <TabsContent value="prompt" className="px-6 py-4 mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">Each line is a separate instruction in the system prompt. Order matters — first line sets the agent's role.</p>
              <AnimatePresence>
                {systemPromptParts.map((part, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex gap-2 items-start"
                  >
                    <span className="mt-2.5 text-xs text-muted-foreground w-4 flex-shrink-0 text-right">{i + 1}.</span>
                    <Textarea
                      value={part}
                      onChange={(e) => updatePromptPart(i, e.target.value)}
                      className="flex-1 bg-secondary/50 resize-none min-h-[64px] text-sm"
                      placeholder={
                        i === 0
                          ? "You are [Role] for [Company]. [Core mission]."
                          : i === 1
                          ? "Rule about what the agent can do without approval."
                          : "Rule about what requires human approval."
                      }
                    />
                    {systemPromptParts.length > 1 && (
                      <button
                        onClick={() => removePromptPart(i)}
                        className="mt-2.5 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button variant="outline" size="sm" onClick={addPromptPart} className="rounded-full gap-1.5 text-xs border-dashed">
                <Plus className="h-3 w-3" /> Add Instruction
              </Button>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-foreground/20" style={{ backgroundColor: color }} />
            <span className="text-xs text-muted-foreground">{selectedToolIds.size} tools · {selectedFeatureIds.size} features</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full">Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !name.trim() || selectedToolIds.size === 0}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 px-5"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
