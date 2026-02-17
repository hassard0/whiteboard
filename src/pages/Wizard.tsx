import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { supabase } from "@/integrations/supabase/client";
import { generateEnvId } from "@/lib/demo-templates";
import {
  INDUSTRY_PRESETS,
  TOOL_LIBRARY,
  AUTH0_FEATURE_LIBRARY,
  getToolsByIndustry,
  type IndustryPreset,
  type ToolTemplate,
} from "@/lib/wizard-catalog";
import type { Auth0Feature } from "@/lib/demo-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Rocket,
  Shield,
  Sparkles,
  Trash2,
  X,
  Plane,
  Heart,
  DollarSign,
  ShoppingCart,
  Users,
  Scale,
  Terminal,
  GripVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import auth0Shield from "@/assets/auth0-shield.png";

const industryIcons: Record<string, React.ElementType> = {
  Plane, Heart, DollarSign, ShoppingCart, Users, Scale, Terminal, Sparkles,
};

// ─── Wizard State ───
interface WizardState {
  // Step 1
  name: string;
  description: string;
  industry: string;
  color: string;
  icon: string;
  // Step 2
  selectedTools: ToolTemplate[];
  customTools: ToolTemplate[];
  // Step 3
  selectedFeatures: string[];
  // Step 4
  systemPrompt: string;
  knowledgePack: string;
  // Step 5
  autopilotSteps: { label: string; message: string; explanation: string; feature: string }[];
}

const STEPS = [
  { id: "basics", label: "Basics", description: "Name & industry" },
  { id: "tools", label: "Tools", description: "Agent capabilities" },
  { id: "features", label: "Auth0", description: "Security features" },
  { id: "prompt", label: "Prompt", description: "Agent personality" },
  { id: "autopilot", label: "Autopilot", description: "Guided script" },
  { id: "review", label: "Launch", description: "Review & go" },
];

export default function WizardPage() {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [state, setState] = useState<WizardState>({
    name: "",
    description: "",
    industry: "",
    color: "hsl(262 83% 58%)",
    icon: "Sparkles",
    selectedTools: [],
    customTools: [],
    selectedFeatures: ["fga", "async-auth", "token-vault"],
    systemPrompt: "",
    knowledgePack: "",
    autopilotSteps: [],
  });

  const update = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ─── Industry selection handler ───
  const selectIndustry = (preset: IndustryPreset) => {
    const tools = getToolsByIndustry(preset.id);
    setState((prev) => ({
      ...prev,
      industry: preset.id,
      color: preset.color,
      icon: preset.icon,
      selectedTools: tools,
      selectedFeatures: preset.suggestedFeatures,
      systemPrompt: prev.systemPrompt || preset.promptHint,
      name: prev.name || `${preset.name} Demo`,
      description: prev.description || preset.description,
    }));
  };

  // ─── Tool management ───
  const toggleTool = (tool: ToolTemplate) => {
    setState((prev) => {
      const exists = prev.selectedTools.find((t) => t.id === tool.id);
      return {
        ...prev,
        selectedTools: exists
          ? prev.selectedTools.filter((t) => t.id !== tool.id)
          : [...prev.selectedTools, tool],
      };
    });
  };

  const addCustomTool = () => {
    const newTool: ToolTemplate = {
      id: `custom_${Date.now()}`,
      name: "New Tool",
      description: "Describe what this tool does",
      scopes: ["custom:read"],
      requiresApproval: false,
      industry: "custom",
    };
    update("customTools", [...state.customTools, newTool]);
  };

  const updateCustomTool = (index: number, field: keyof ToolTemplate, value: any) => {
    const tools = [...state.customTools];
    (tools[index] as any)[field] = value;
    update("customTools", tools);
  };

  const removeCustomTool = (index: number) => {
    update("customTools", state.customTools.filter((_, i) => i !== index));
  };

  // ─── Autopilot step management ───
  const addAutopilotStep = () => {
    update("autopilotSteps", [
      ...state.autopilotSteps,
      { label: `Step ${state.autopilotSteps.length + 1}`, message: "", explanation: "", feature: "" },
    ]);
  };

  const updateAutopilotStep = (index: number, field: string, value: string) => {
    const steps = [...state.autopilotSteps];
    (steps[index] as any)[field] = value;
    update("autopilotSteps", steps);
  };

  const removeAutopilotStep = (index: number) => {
    update("autopilotSteps", state.autopilotSteps.filter((_, i) => i !== index));
  };

  // ─── Navigation ───
  const canAdvance = () => {
    if (step === 0) return state.name.trim() && state.industry;
    if (step === 1) return state.selectedTools.length > 0 || state.customTools.length > 0;
    if (step === 2) return state.selectedFeatures.length > 0;
    if (step === 3) return state.systemPrompt.trim();
    return true;
  };

  // ─── Save & Launch ───
  const handleLaunch = async () => {
    if (!user?.sub) return;
    setSaving(true);

    const allTools = [...state.selectedTools, ...state.customTools];
    const features = AUTH0_FEATURE_LIBRARY.filter((f) => state.selectedFeatures.includes(f.id));

    const templateId = `custom-${Date.now()}`;
    const envId = generateEnvId(user.sub, templateId);

    const customConfig = {
      wizard: true,
      name: state.name,
      description: state.description,
      industry: state.industry,
      color: state.color,
      icon: state.icon,
      tools: allTools,
      auth0Features: features,
      systemPromptParts: [state.systemPrompt],
      knowledgePack: state.knowledgePack,
      autopilotSteps: state.autopilotSteps,
    };

    try {
      const { error } = await supabase
        .from("demo_environments")
        .upsert({
          env_id: envId,
          auth0_sub: user.sub,
          template_id: templateId,
          env_type: "custom",
          config_overrides: customConfig as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: "env_id" });

      if (error) throw error;

      toast.success("Demo created!");
      // Navigate to demo with the custom config
      navigate(`/demo/${templateId}`, {
        state: {
          customDemo: customConfig,
        },
      });
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={auth0Shield} alt="Auth0" className="h-5 w-5 invert" />
            <div>
              <h1 className="text-sm font-semibold text-foreground">Demo Wizard</h1>
              <span className="text-xs text-muted-foreground">Create a custom demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-6 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <button
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    i === step
                      ? "bg-primary text-primary-foreground"
                      : i < step
                      ? "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : null}
                  <span>{s.label}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Step 0: Basics */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">What kind of demo?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Choose an industry to auto-populate tools, or start from scratch.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {INDUSTRY_PRESETS.map((preset) => {
                    const Icon = industryIcons[preset.icon] || Sparkles;
                    const selected = state.industry === preset.id;
                    return (
                      <Card
                        key={preset.id}
                        className={`cursor-pointer transition-all ${
                          selected ? "border-primary ring-1 ring-primary/30 shadow-lg shadow-primary/10" : "hover:border-primary/30"
                        }`}
                        onClick={() => selectIndustry(preset)}
                      >
                        <CardContent className="p-4 text-center space-y-2">
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${preset.color}15` }}>
                            <Icon className="h-5 w-5" style={{ color: preset.color }} />
                          </div>
                          <span className="text-sm font-medium text-foreground block">{preset.name}</span>
                          <span className="text-[10px] text-muted-foreground block leading-tight">{preset.description}</span>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {state.industry && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-foreground">Demo Name</label>
                      <Input
                        value={state.name}
                        onChange={(e) => update("name", e.target.value)}
                        placeholder="e.g. Healthcare AI Assistant"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">Short Description</label>
                      <Input
                        value={state.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="One-line description of the demo"
                        className="mt-1.5"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 1: Tools */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Configure Agent Tools</h2>
                  <p className="text-sm text-muted-foreground mt-1">Select tools from the library or create custom ones. Tools with 🔒 require user approval.</p>
                </div>

                {/* Industry tools */}
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggested for {INDUSTRY_PRESETS.find((p) => p.id === state.industry)?.name || "your industry"}
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {getToolsByIndustry(state.industry).map((tool) => {
                      const selected = state.selectedTools.some((t) => t.id === tool.id);
                      return (
                        <div
                          key={tool.id}
                          onClick={() => toggleTool(tool)}
                          className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                            selected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{tool.name}</span>
                              {tool.requiresApproval && (
                                <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">🔒</Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{tool.description}</p>
                            <div className="flex gap-1 mt-1">
                              {tool.scopes.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[8px] font-mono h-3.5 px-1">{s}</Badge>
                              ))}
                            </div>
                          </div>
                          <div className={`ml-3 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}>
                            {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Browse other tools */}
                <details className="group">
                  <summary className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">
                    Browse All Tools ({TOOL_LIBRARY.length} available) ▾
                  </summary>
                  <div className="mt-3 grid gap-2 md:grid-cols-2 max-h-60 overflow-y-auto">
                    {TOOL_LIBRARY.filter((t) => t.industry !== state.industry).map((tool) => {
                      const selected = state.selectedTools.some((t) => t.id === tool.id);
                      return (
                        <div
                          key={tool.id}
                          onClick={() => toggleTool(tool)}
                          className={`flex items-center justify-between rounded-lg border p-2.5 cursor-pointer transition-all ${
                            selected ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-foreground">{tool.name}</span>
                              {tool.requiresApproval && <span className="text-[9px]">🔒</span>}
                              <Badge variant="secondary" className="text-[8px] h-3.5 px-1">{tool.industry}</Badge>
                            </div>
                          </div>
                          <div className={`ml-2 h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            selected ? "border-primary bg-primary" : "border-muted-foreground/30"
                          }`}>
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>

                {/* Custom tools */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Custom Tools</h3>
                    <Button variant="outline" size="sm" onClick={addCustomTool} className="h-7 text-xs">
                      <Plus className="mr-1 h-3 w-3" /> Add Tool
                    </Button>
                  </div>
                  {state.customTools.map((tool, i) => (
                    <div key={tool.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={tool.name}
                          onChange={(e) => updateCustomTool(i, "name", e.target.value)}
                          placeholder="Tool name"
                          className="text-sm h-8"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCustomTool(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        value={tool.description}
                        onChange={(e) => updateCustomTool(i, "description", e.target.value)}
                        placeholder="What does this tool do?"
                        className="text-xs h-7"
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          value={tool.scopes.join(", ")}
                          onChange={(e) => updateCustomTool(i, "scopes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                          placeholder="Scopes (comma-separated)"
                          className="text-xs h-7 font-mono flex-1"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Switch
                            checked={tool.requiresApproval}
                            onCheckedChange={(v) => updateCustomTool(i, "requiresApproval", v)}
                          />
                          <span className="text-[10px] text-muted-foreground">Approval</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-muted-foreground">
                  {state.selectedTools.length + state.customTools.length} tool{state.selectedTools.length + state.customTools.length !== 1 ? "s" : ""} selected
                </div>
              </div>
            )}

            {/* Step 2: Auth0 Features */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Auth0 Features to Showcase</h2>
                  <p className="text-sm text-muted-foreground mt-1">Toggle which Auth0 capabilities to highlight during the demo.</p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {AUTH0_FEATURE_LIBRARY.map((feature) => {
                    const selected = state.selectedFeatures.includes(feature.id);
                    return (
                      <div
                        key={feature.id}
                        className={`flex items-center justify-between rounded-lg border p-4 transition-all ${
                          selected ? "border-primary/40 bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{feature.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                        </div>
                        <Switch
                          checked={selected}
                          onCheckedChange={(checked) => {
                            update(
                              "selectedFeatures",
                              checked
                                ? [...state.selectedFeatures, feature.id]
                                : state.selectedFeatures.filter((id) => id !== feature.id),
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: System Prompt */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Agent Personality & Knowledge</h2>
                  <p className="text-sm text-muted-foreground mt-1">Customize the AI agent's behavior and talking points.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-foreground">System Prompt</label>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Define the agent's role, personality, and rules.</p>
                    <Textarea
                      value={state.systemPrompt}
                      onChange={(e) => update("systemPrompt", e.target.value)}
                      placeholder="You are an AI agent that..."
                      className="min-h-[120px] text-sm font-mono bg-secondary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Auth0 Knowledge Pack</label>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Key talking points about how Auth0 secures this workflow.</p>
                    <Textarea
                      value={state.knowledgePack}
                      onChange={(e) => update("knowledgePack", e.target.value)}
                      placeholder="This demo showcases Auth0's ability to..."
                      className="min-h-[100px] text-sm bg-secondary/30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Autopilot Script */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Autopilot Script</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Build a step-by-step walkthrough. Each step auto-sends a message and shows an explanation.
                    <span className="text-primary"> Optional — skip to launch without autopilot.</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {state.autopilotSteps.map((astep, i) => (
                    <motion.div
                      key={i}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-lg border border-border p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                          <Badge variant="secondary" className="text-[10px]">Step {i + 1}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeAutopilotStep(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <Input
                        value={astep.label}
                        onChange={(e) => updateAutopilotStep(i, "label", e.target.value)}
                        placeholder="Step label (e.g. 'Search Flights')"
                        className="text-sm h-8"
                      />
                      <Input
                        value={astep.message}
                        onChange={(e) => updateAutopilotStep(i, "message", e.target.value)}
                        placeholder="Message to send (e.g. 'Search for flights from NYC to SF')"
                        className="text-sm h-8"
                      />
                      <Textarea
                        value={astep.explanation}
                        onChange={(e) => updateAutopilotStep(i, "explanation", e.target.value)}
                        placeholder="Explanation shown to the viewer (what Auth0 is doing)"
                        className="text-xs min-h-[60px]"
                      />
                      <Input
                        value={astep.feature}
                        onChange={(e) => updateAutopilotStep(i, "feature", e.target.value)}
                        placeholder="Auth0 feature to highlight (e.g. 'Token Vault')"
                        className="text-xs h-7"
                      />
                    </motion.div>
                  ))}
                </div>

                <Button variant="outline" onClick={addAutopilotStep} className="w-full">
                  <Plus className="mr-1.5 h-4 w-4" /> Add Step
                </Button>
              </div>
            )}

            {/* Step 5: Review & Launch */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Review & Launch</h2>
                  <p className="text-sm text-muted-foreground mt-1">Everything looks good? Launch your custom demo.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Demo Info</h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium text-foreground">{state.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="font-medium text-foreground">{INDUSTRY_PRESETS.find((p) => p.id === state.industry)?.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Tools</span><span className="font-medium text-foreground">{state.selectedTools.length + state.customTools.length}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Approval gates</span><span className="font-medium text-foreground">{[...state.selectedTools, ...state.customTools].filter((t) => t.requiresApproval).length}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Autopilot steps</span><span className="font-medium text-foreground">{state.autopilotSteps.length || "None"}</span></div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">Auth0 Features</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {AUTH0_FEATURE_LIBRARY.filter((f) => state.selectedFeatures.includes(f.id)).map((f) => (
                          <Badge key={f.id} variant="outline" className="text-[10px] border-primary/30 text-primary">
                            <Shield className="mr-0.5 h-2.5 w-2.5" />
                            {f.name}
                          </Badge>
                        ))}
                      </div>
                      <h3 className="text-sm font-semibold text-foreground pt-2">Tools</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {[...state.selectedTools, ...state.customTools].map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-[10px]">
                            {t.name}
                            {t.requiresApproval && <span className="ml-0.5">🔒</span>}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  size="lg"
                  onClick={handleLaunch}
                  disabled={saving}
                  className="w-full gradient-auth0 text-primary-foreground h-12 text-base font-semibold"
                >
                  {saving ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating Demo...</>
                  ) : (
                    <><Rocket className="mr-2 h-5 w-5" /> Launch Demo</>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Button>

          {step < STEPS.length - 1 && (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="gradient-auth0 text-primary-foreground"
            >
              Next <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}