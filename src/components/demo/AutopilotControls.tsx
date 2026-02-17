import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, ChevronRight, CheckCircle2, Circle, Pause, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AutopilotScript, AutopilotStep } from "@/lib/autopilot-scripts";

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

  const step = script.steps[currentStep];
  const isComplete = currentStep >= script.steps.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-4 max-w-3xl"
    >
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        {/* Progress bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              Autopilot
            </Badge>
            <span className="text-xs text-muted-foreground">
              Step {Math.min(currentStep + 1, script.steps.length)} of {script.steps.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={onStop}>
            <Pause className="mr-1 h-3 w-3" /> Exit
          </Button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1.5">
          {script.steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep
                  ? "bg-primary"
                  : i === currentStep
                  ? "bg-primary/50"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {!isComplete && step && (
          <>
            {/* Current step info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{step.label}</span>
                {step.highlightFeature && (
                  <Badge variant="secondary" className="text-[10px]">
                    {step.highlightFeature}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.explanation}</p>
            </div>

            {/* Action button */}
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
                  Agent is responding...
                </>
              ) : (
                <>
                  <SkipForward className="mr-1.5 h-3.5 w-3.5" />
                  Send: "{step.userMessage.slice(0, 50)}{step.userMessage.length > 50 ? "..." : ""}"
                </>
              )}
            </Button>
          </>
        )}

        {isComplete && (
          <div className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <div>
              <span className="text-sm font-medium text-foreground">Walkthrough Complete</span>
              <p className="text-xs text-muted-foreground">You've seen all the Auth0 security patterns in action.</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}