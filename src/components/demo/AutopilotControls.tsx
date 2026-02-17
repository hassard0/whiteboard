import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, Pause, SkipForward, Shield } from "lucide-react";
import { motion } from "framer-motion";
import type { AutopilotScript } from "@/lib/autopilot-scripts";

interface AutopilotControlsProps {
  script: AutopilotScript;
  currentStep: number;
  isActive: boolean;
  isWaiting: boolean;
  onStart: () => void;
  onAdvance: () => void;
  onStop: () => void;
}

export function AutopilotControls({
  script,
  currentStep,
  isActive,
  isWaiting,
  onStart,
  onAdvance,
  onStop,
}: AutopilotControlsProps) {
  // Inactive — render as a banner prompt
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mb-4 max-w-3xl"
      >
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Play className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Autopilot Available</span>
              </div>
              <p className="text-xs text-muted-foreground">{script.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{script.steps.length} guided steps</p>
            </div>
            <Button size="sm" onClick={onStart} className="gradient-auth0 text-primary-foreground">
              <Play className="mr-1.5 h-3.5 w-3.5" /> Start Walkthrough
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Active — render as a sidebar panel
  const step = script.steps[currentStep];
  const isComplete = currentStep >= script.steps.length;

  return (
    <div className="flex h-full flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="text-xs border-primary/30 text-primary">
          Autopilot
        </Badge>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onStop}>
          <Pause className="mr-1 h-3 w-3" /> Exit
        </Button>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">{script.title}</h3>
      <p className="text-[11px] text-muted-foreground mb-4">
        Step {Math.min(currentStep + 1, script.steps.length)} of {script.steps.length}
      </p>

      {/* Step list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {script.steps.map((s, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep && !isComplete;

          return (
            <div
              key={s.id}
              className={`rounded-lg border p-2.5 transition-all ${
                isCurrent
                  ? "border-primary/40 bg-primary/10"
                  : isDone
                  ? "border-border/50 bg-secondary/30 opacity-70"
                  : "border-border/30 opacity-40"
              }`}
            >
              <div className="flex items-start gap-2">
                {isDone ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                ) : isCurrent ? (
                  <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary" />
                ) : (
                  <div className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-border" />
                )}
                <div className="min-w-0">
                  <span className={`text-xs font-medium block ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                  {isCurrent && s.highlightFeature && (
                    <Badge variant="secondary" className="text-[9px] mt-1 h-4 px-1.5">
                      <Shield className="mr-0.5 h-2.5 w-2.5" />
                      {s.highlightFeature}
                    </Badge>
                  )}
                  {isCurrent && (
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                      {s.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action button — pinned to bottom */}
      <div className="mt-4 pt-3 border-t border-border">
        {!isComplete && step ? (
          <Button
            size="sm"
            onClick={onAdvance}
            disabled={isWaiting}
            className="w-full gradient-auth0 text-primary-foreground"
          >
            {isWaiting ? (
              <>
                <div className="mr-2 flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground [animation-delay:300ms]" />
                </div>
                Responding...
              </>
            ) : (
              <>
                <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                Next Step
              </>
            )}
          </Button>
        ) : isComplete ? (
          <div className="flex items-center gap-2 py-1">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium text-foreground">Complete</span>
              <p className="text-[11px] text-muted-foreground">All Auth0 patterns demonstrated.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
