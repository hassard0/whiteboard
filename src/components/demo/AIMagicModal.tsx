import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Globe, ArrowRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedDemoConfig {
  name: string;
  description: string;
  color: string;
  tools: Array<{
    id: string;
    name: string;
    description: string;
    scopes: string[];
    requiresApproval: boolean;
    mockDelay: number;
  }>;
  auth0Features: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
  systemPromptParts: string[];
  knowledgePack: string;
  customerLogo?: string;
  customerName?: string;
  wizard: true;
}

interface AIMagicModalProps {
  open: boolean;
  onClose: () => void;
  onGenerated: (config: GeneratedDemoConfig) => void;
}

const EXAMPLE_PROMPTS = [
  "A healthcare AI assistant for managing patient appointments and prescriptions with HIPAA compliance controls",
  "A fintech AI agent helping wealth managers with portfolio analysis and trade approvals",
  "An HR AI copilot for onboarding new employees with delegated access to HR systems",
];

export function AIMagicModal({ open, onClose, onGenerated }: AIMagicModalProps) {
  const [prompt, setPrompt] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState<"input" | "generating" | "done">("input");
  const [statusMsg, setStatusMsg] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please describe the demo you want to create");
      return;
    }

    setGenerating(true);
    setStep("generating");
    setStatusMsg("Analyzing your requirements…");

    try {
      // Step 1: fetch logo if URL provided
      let logoUrl: string | undefined;
      let customerName: string | undefined;

      if (websiteUrl.trim()) {
        setStatusMsg("Fetching brand assets from website…");
        try {
          const { data: logoData } = await supabase.functions.invoke("ai-demo-generator", {
            body: { action: "fetch_logo", url: websiteUrl.trim() },
          });
          if (logoData?.logoUrl) logoUrl = logoData.logoUrl;
          if (logoData?.companyName) customerName = logoData.companyName;
        } catch (e) {
          console.warn("Logo fetch failed, continuing without logo", e);
        }
      }

      // Step 2: Generate the demo config with AI
      setStatusMsg("Designing tools and authorization flows…");
      const { data, error } = await supabase.functions.invoke("ai-demo-generator", {
        body: {
          action: "generate_config",
          prompt: prompt.trim(),
          websiteUrl: websiteUrl.trim() || undefined,
          customerName,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.config) throw new Error("No config returned");

      setStatusMsg("Finalizing your demo…");
      await new Promise((r) => setTimeout(r, 600));

      const finalConfig: GeneratedDemoConfig = {
        ...data.config,
        customerLogo: logoUrl,
        customerName: customerName || data.config.customerName,
        wizard: true,
      };

      setStep("done");
      setTimeout(() => {
        onGenerated(finalConfig);
        onClose();
        resetState();
      }, 800);
    } catch (e: any) {
      toast.error("Generation failed: " + (e.message || "Unknown error"));
      setStep("input");
      setGenerating(false);
    }
  };

  const resetState = () => {
    setPrompt("");
    setWebsiteUrl("");
    setGenerating(false);
    setStep("input");
    setStatusMsg("");
  };

  const handleClose = () => {
    if (generating) return;
    onClose();
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl border-border/60 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            AI Demo Generator
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Describe the demo you want to build
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. An AI assistant for a wealth management firm that can view portfolios, initiate trades with human approval, and access client records securely..."
                  className="min-h-[110px] resize-none bg-secondary/50 text-sm"
                />
              </div>

              {/* Example prompts */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">Quick examples:</span>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="text-left text-xs text-muted-foreground hover:text-foreground transition-colors rounded px-2 py-1 hover:bg-secondary/60 border border-transparent hover:border-border/40"
                    >
                      → {ex}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer URL */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Customer website <span className="text-xs text-muted-foreground font-normal">(optional — to pull their logo)</span>
                </label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://acme.com"
                  className="bg-secondary/50 text-sm"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">AI-powered</Badge>
                  <Badge variant="secondary" className="text-[10px]">Auth0-aware</Badge>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim()}
                  className="gap-1.5 gradient-auth0 text-primary-foreground rounded-full px-5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          )}

          {(step === "generating" || step === "done") && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="flex flex-col items-center justify-center py-12 gap-5"
            >
              <div className="relative flex h-16 w-16 items-center justify-center">
                {step === "generating" && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${step === "done" ? "bg-accent/20" : "bg-primary/10"}`}>
                  {step === "done" ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                      <Sparkles className="h-7 w-7 text-primary" />
                    </motion.div>
                  ) : (
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  )}
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {step === "done" ? "Demo Ready!" : "Building your demo…"}
                </p>
                <p className="text-xs text-muted-foreground">{step === "done" ? "Launching now…" : statusMsg}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
