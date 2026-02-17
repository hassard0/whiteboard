import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Check, X, Info } from "lucide-react";
import { motion } from "framer-motion";

export interface ApprovalRequest {
  id: string;
  toolName: string;
  toolDescription: string;
  scopes: string[];
  dataSummary: Record<string, string>;
  auth0Feature: string;
  auth0Explanation: string;
}

interface ApprovalModalProps {
  request: ApprovalRequest | null;
  onDecision: (requestId: string, decision: "approved" | "denied") => void;
}

export function ApprovalModal({ request, onDecision }: ApprovalModalProps) {
  if (!request) return null;

  return (
    <Dialog open={!!request} onOpenChange={() => onDecision(request.id, "denied")}>
      <DialogContent className="border-primary/30 bg-card sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-auth0">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <Badge variant="outline" className="text-xs border-primary/40 text-primary">
              Approval Required
            </Badge>
          </div>
          <DialogTitle className="text-lg">
            Agent wants to: {request.toolName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {request.toolDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Data Summary */}
        {Object.keys(request.dataSummary).length > 0 && (
          <div className="rounded-lg border border-border bg-secondary/50 p-3 space-y-1.5">
            {Object.entries(request.dataSummary).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{key}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Scopes */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Required Scopes</span>
          <div className="flex flex-wrap gap-1.5">
            {request.scopes.map((scope) => (
              <Badge key={scope} variant="secondary" className="text-xs font-mono">
                {scope}
              </Badge>
            ))}
          </div>
        </div>

        {/* Auth0 Explanation */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{request.auth0Feature}:</span>{" "}
            {request.auth0Explanation}
          </div>
        </motion.div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onDecision(request.id, "denied")}
            className="flex-1"
          >
            <X className="mr-1.5 h-4 w-4" />
            Deny
          </Button>
          <Button
            onClick={() => onDecision(request.id, "approved")}
            className="flex-1 gradient-auth0 text-primary-foreground"
          >
            <Check className="mr-1.5 h-4 w-4" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
