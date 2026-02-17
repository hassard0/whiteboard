import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getTemplateById, type DemoTemplate, type DemoTool } from "@/lib/demo-templates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Eye, Shield, Wrench, Save, RotateCcw } from "lucide-react";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function BuilderPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth0();
  const baseTemplate = getTemplateById(templateId || "");

  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    baseTemplate?.tools.forEach((t) => { map[t.id] = true; });
    return map;
  });

  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    baseTemplate?.auth0Features.forEach((f) => { map[f.id] = true; });
    return map;
  });

  const [customPrompt, setCustomPrompt] = useState("");
  const [customKnowledge, setCustomKnowledge] = useState("");

  if (!baseTemplate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </div>
    );
  }

  const handlePreview = () => {
    // Build custom config and pass via state
    const customConfig = {
      enabledTools: Object.entries(enabledTools).filter(([, v]) => v).map(([k]) => k),
      enabledFeatures: Object.entries(enabledFeatures).filter(([, v]) => v).map(([k]) => k),
      customPrompt,
      customKnowledge,
    };
    navigate(`/demo/${templateId}`, { state: { builderConfig: customConfig } });
  };

  const handleReset = () => {
    baseTemplate.tools.forEach((t) => setEnabledTools((prev) => ({ ...prev, [t.id]: true })));
    baseTemplate.auth0Features.forEach((f) => setEnabledFeatures((prev) => ({ ...prev, [f.id]: true })));
    setCustomPrompt("");
    setCustomKnowledge("");
    toast.success("Configuration reset to defaults");
  };

  const activeToolCount = Object.values(enabledTools).filter(Boolean).length;
  const activeFeatureCount = Object.values(enabledFeatures).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-semibold">Builder Mode</h1>
              </div>
              <span className="text-xs text-muted-foreground">{baseTemplate.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
            </Button>
            <Button size="sm" onClick={handlePreview} className="gradient-auth0 text-primary-foreground">
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Preview Demo
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tools Configuration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Available Tools</span>
                <Badge variant="secondary" className="text-xs">
                  {activeToolCount}/{baseTemplate.tools.length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {baseTemplate.tools.map((tool) => (
                <motion.div
                  key={tool.id}
                  layout
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{tool.name}</span>
                      {tool.requiresApproval && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary h-4 px-1.5">
                          <Shield className="mr-0.5 h-2.5 w-2.5" /> Approval
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                    <div className="flex gap-1 mt-1.5">
                      {tool.scopes.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[9px] font-mono h-4 px-1">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Switch
                    checked={enabledTools[tool.id] ?? true}
                    onCheckedChange={(checked) => setEnabledTools((prev) => ({ ...prev, [tool.id]: checked }))}
                  />
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Auth0 Features */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Auth0 Features to Highlight</span>
                <Badge variant="secondary" className="text-xs">
                  {activeFeatureCount}/{baseTemplate.auth0Features.length} active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {baseTemplate.auth0Features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium">{feature.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                  <Switch
                    checked={enabledFeatures[feature.id] ?? true}
                    onCheckedChange={(checked) => setEnabledFeatures((prev) => ({ ...prev, [feature.id]: checked }))}
                  />
                </div>
              ))}

              {/* Custom Prompt */}
              <div className="pt-4 border-t border-border space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Custom System Prompt Addition</label>
                  <Textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Add custom instructions for the AI agent..."
                    className="mt-1.5 min-h-[80px] text-sm bg-secondary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Custom Knowledge / Talking Points</label>
                  <Textarea
                    value={customKnowledge}
                    onChange={(e) => setCustomKnowledge(e.target.value)}
                    placeholder="Add specific talking points about Auth0 features..."
                    className="mt-1.5 min-h-[80px] text-sm bg-secondary/50"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
