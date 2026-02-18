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
import { Check, Plus, Trash2, Shield, UserCheck, Key, Lock, FileText, User, ArrowRightLeft, GripVertical, Globe } from "lucide-react";
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

interface AutopilotStep {
  label: string;
  message: string;
  explanation: string;
  feature: string;
}

export function EditDemoModal({ open, demo, onClose, onSave }: EditDemoModalProps) {
  const cfg = demo?.config_overrides as any;

  // --- Form state ---
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerLogo, setCustomerLogo] = useState("");
  const [color, setColor] = useState("hsl(262 83% 58%)");
  const [knowledgePack, setKnowledgePack] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const [toolOverrides, setToolOverrides] = useState<Record<string, { requiresApproval: boolean; description: string }>>({});
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [featureDescOverrides, setFeatureDescOverrides] = useState<Record<string, string>>({});
  const [systemPromptParts, setSystemPromptParts] = useState<string[]>([""]);
  const [autopilotSteps, setAutopilotSteps] = useState<AutopilotStep[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync state when demo changes
  useEffect(() => {
    if (!cfg) return;
    setName(cfg.name || "");
    setDescription(cfg.description || "");
    setCustomerName(cfg.customerName || "");
    setCustomerLogo(cfg.customerLogo || "");
    setColor(cfg.color || "hsl(262 83% 58%)");
    setKnowledgePack(cfg.knowledgePack || "");
    setSystemPromptParts(cfg.systemPromptParts?.length ? cfg.systemPromptParts : [""]);
    setAutopilotSteps(cfg.autopilotSteps?.length ? cfg.autopilotSteps : []);

    const toolIds = new Set<string>((cfg.tools || []).map((t: any) => t.id));
    setSelectedToolIds(toolIds);
    const overrides: Record<string, { requiresApproval: boolean; description: string }> = {};
    for (const t of (cfg.tools || [])) {
      overrides[t.id] = { requiresApproval: t.requiresApproval, description: t.description };
    }
    setToolOverrides(overrides);

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
        if (!toolOverrides[toolId]) {
          const lib = TOOL_LIBRARY.find((t) => t.id === toolId);
          if (lib) setToolOverrides((o) => ({ ...o, [toolId]: { requiresApproval: lib.requiresApproval, description: lib.description } }));
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

  const updatePromptPart = (i: number, val: string) => setSystemPromptParts((prev) => prev.map((p, idx) => idx === i ? val : p));
  const addPromptPart = () => setSystemPromptParts((p) => [...p, ""]);
  const removePromptPart = (i: number) => setSystemPromptParts((p) => p.filter((_, idx) => idx !== i));

  const addAutopilotStep = () => setAutopilotSteps((s) => [...s, { label: `Step ${s.length + 1}`, message: "", explanation: "", feature: "" }]);
  const updateAutopilotStep = (i: number, field: keyof AutopilotStep, val: string) =>
    setAutopilotSteps((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const removeAutopilotStep = (i: number) => setAutopilotSteps((s) => s.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setSaving(true);
    try {
      const tools = Array.from(selectedToolIds).map((id) => {
        const lib = TOOL_LIBRARY.find((t) => t.id === id)!;
        const override = toolOverrides[id];
        return { ...lib, requiresApproval: override?.requiresApproval ?? lib.requiresApproval, description: override?.description || lib.description };
      });

      const auth0Features = Array.from(selectedFeatureIds).map((id) => {
        const lib = AUTH0_FEATURE_LIBRARY.find((f) => f.id === id)!;
        return { ...lib, description: featureDescOverrides[id] || lib.description };
      });

      const newConfig = {
        ...cfg,
        name,
        description,
        customerName: customerName || undefined,
        customerLogo: customerLogo || undefined,
        color,
        knowledgePack,
        systemPromptParts: systemPromptParts.filter((p) => p.trim()),
        tools,
        auth0Features,
        autopilotSteps,
        wizard: true,
      };

      await onSave(demo.id, newConfig);
    } finally {
      setSaving(false);
    }
  };

  const toolsByIndustry = TOOL_LIBRARY.reduce<Record<string, ToolDef[]>>((acc, tool) => {
    if (!acc[tool.industry]) acc[tool.industry] = [];
    acc[tool.industry].push(tool);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl border-border/60 bg-card/95 backdrop-blur-xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/40">
          <DialogTitle className="text-lg font-semibold">Edit Demo</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-6 mt-3 mb-0 grid grid-cols-5 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">
              Tools <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{selectedToolIds.size}</Badge>
            </TabsTrigger>
            <TabsTrigger value="auth0" className="text-xs">
              Auth0 <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{selectedFeatureIds.size}</Badge>
            </TabsTrigger>
            <TabsTrigger value="prompt" className="text-xs">Prompt</TabsTrigger>
            <TabsTrigger value="autopilot" className="text-xs">
              Autopilot <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4">{autopilotSteps.length}</Badge>
            </TabsTrigger>
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
                  <Label className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Logo URL</Label>
                  <Input value={customerLogo} onChange={(e) => setCustomerLogo(e.target.value)} className="bg-secondary/50 text-xs" placeholder="https://logo.clearbit.com/ikea.com" />
                  {customerLogo && (
                    <div className="mt-1 flex items-center gap-2">
                      <img src={customerLogo} alt="logo preview" className="h-8 w-8 object-contain rounded border border-border/40" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      <span className="text-xs text-muted-foreground">Preview</span>
                    </div>
                  )}
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Brand Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {HSL_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn("h-6 w-6 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <Input value={color} onChange={(e) => setColor(e.target.value)} className="bg-secondary/50 text-xs font-mono mt-1" placeholder="hsl(262 83% 58%)" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Knowledge Pack <span className="text-xs text-muted-foreground font-normal">(Auth0 talking points shown in demo)</span></Label>
                  <Textarea value={knowledgePack} onChange={(e) => setKnowledgePack(e.target.value)} className="bg-secondary/50 resize-none min-h-[80px]" placeholder="Explain which Auth0 features are used and why they matter for this use case." />
                </div>
              </div>
            </TabsContent>

            {/* TOOLS TAB */}
            <TabsContent value="tools" className="px-6 py-4 mt-0 space-y-6">
              <p className="text-xs text-muted-foreground">Select which tools this agent can use. Toggle approval requirement per tool.</p>
              {Object.entries(toolsByIndustry).map(([industry, tools]) => (
                <div key={industry}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{INDUSTRY_GROUPS[industry] || industry}</p>
                  <div className="space-y-1.5">
                    {tools.map((tool) => {
                      const isSelected = selectedToolIds.has(tool.id);
                      const override = toolOverrides[tool.id];
                      const requiresApproval = override?.requiresApproval ?? tool.requiresApproval;
                      const desc = override?.description ?? tool.description;
                      return (
                        <div key={tool.id} className={cn("rounded-lg border p-3 transition-all", isSelected ? "border-primary/40 bg-primary/5" : "border-border/40 bg-secondary/20")}>
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleTool(tool.id)}
                              className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-transparent")}
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
                                      onCheckedChange={(v) => setToolOverrides((o) => ({ ...o, [tool.id]: { ...o[tool.id], requiresApproval: v, description: desc } }))}
                                      className="h-4 w-7 data-[state=checked]:bg-primary"
                                    />
                                  </div>
                                )}
                              </div>
                              {isSelected ? (
                                <Input
                                  value={desc}
                                  onChange={(e) => setToolOverrides((o) => ({ ...o, [tool.id]: { requiresApproval, description: e.target.value } }))}
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
                  <div key={feature.id} className={cn("rounded-lg border p-3 transition-all", isSelected ? "border-primary/40 bg-primary/5" : "border-border/40 bg-secondary/20")}>
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleFeature(feature.id)}
                        className={cn("mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all", isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border/60 bg-transparent")}
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
              <p className="text-xs text-muted-foreground">Each line is a separate instruction in the system prompt. First line sets the agent's role — be specific to the company and user type.</p>
              <AnimatePresence>
                {systemPromptParts.map((part, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex gap-2 items-start">
                    <span className="mt-2.5 text-xs text-muted-foreground w-4 flex-shrink-0 text-right">{i + 1}.</span>
                    <Textarea
                      value={part}
                      onChange={(e) => updatePromptPart(i, e.target.value)}
                      className="flex-1 bg-secondary/50 resize-none min-h-[64px] text-sm"
                      placeholder={i === 0 ? "You are [Role] for [Company]. [Core mission...]" : i === 1 ? "You can access [data types] without approval..." : "Always require approval before [sensitive action]..."}
                    />
                    {systemPromptParts.length > 1 && (
                      <button onClick={() => removePromptPart(i)} className="mt-2.5 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button variant="outline" size="sm" onClick={addPromptPart} className="w-full h-8 text-xs">
                <Plus className="mr-1.5 h-3 w-3" /> Add Instruction
              </Button>
            </TabsContent>

            {/* AUTOPILOT TAB */}
            <TabsContent value="autopilot" className="px-6 py-4 mt-0 space-y-3">
              <p className="text-xs text-muted-foreground">
                Build a step-by-step guided demo. Each step auto-sends a message to the agent and shows an Auth0 explanation to the viewer.
                <span className="text-primary"> Optional — demos work without autopilot steps.</span>
              </p>
              <AnimatePresence>
                {autopilotSteps.map((astep, i) => (
                  <motion.div key={i} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-lg border border-border/60 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                        <Badge variant="secondary" className="text-[10px]">Step {i + 1}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAutopilotStep(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Step Label</Label>
                      <Input
                        value={astep.label}
                        onChange={(e) => updateAutopilotStep(i, "label", e.target.value)}
                        placeholder="e.g. 'View Portfolio'"
                        className="h-8 text-sm bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Message to Send</Label>
                      <Input
                        value={astep.message}
                        onChange={(e) => updateAutopilotStep(i, "message", e.target.value)}
                        placeholder="e.g. 'Show me my current portfolio holdings'"
                        className="h-8 text-sm bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Auth0 Explanation (shown to viewer)</Label>
                      <Textarea
                        value={astep.explanation}
                        onChange={(e) => updateAutopilotStep(i, "explanation", e.target.value)}
                        placeholder="What Auth0 is doing behind the scenes at this step..."
                        className="text-xs bg-secondary/50 resize-none min-h-[60px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Auth0 Feature Highlighted</Label>
                      <Input
                        value={astep.feature}
                        onChange={(e) => updateAutopilotStep(i, "feature", e.target.value)}
                        placeholder="e.g. 'Token Vault' or 'Fine-Grained Authorization'"
                        className="h-8 text-xs bg-secondary/50"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Button variant="outline" onClick={addAutopilotStep} className="w-full h-8 text-xs">
                <Plus className="mr-1.5 h-3 w-3" /> Add Autopilot Step
              </Button>
            </TabsContent>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border/40 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-muted-foreground">{selectedToolIds.size} tools · {selectedFeatureIds.size} Auth0 features · {autopilotSteps.length} autopilot steps</p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gradient-auth0 text-primary-foreground rounded-full px-5">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
