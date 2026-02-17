import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Key, UserCheck, ArrowRightLeft, MessageSquare, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export interface TimelineEvent {
  id: string;
  type: "auth" | "tool_call" | "approval" | "token_exchange" | "message";
  title: string;
  detail?: string;
  status?: "success" | "denied" | "pending";
  timestamp: Date;
  auth0Feature?: string;
}

interface EventTimelineProps {
  events: TimelineEvent[];
}

const eventIcons = {
  auth: Shield,
  tool_call: Key,
  approval: UserCheck,
  token_exchange: ArrowRightLeft,
  message: MessageSquare,
};

const eventColors = {
  auth: "text-primary",
  tool_call: "text-blue-400",
  approval: "text-yellow-400",
  token_exchange: "text-auth0-teal",
  message: "text-muted-foreground",
};

export function EventTimeline({ events }: EventTimelineProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`relative flex flex-col border-l border-border bg-card/50 transition-all duration-300 ${collapsed ? "w-12" : "w-72"}`}>
      {/* Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -left-4 top-3 z-10 h-8 w-8 rounded-full border border-border bg-card"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>

      {!collapsed && (
        <>
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Event Timeline
            </h3>
            <span className="text-[10px] text-muted-foreground">{events.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            <AnimatePresence>
              {events.map((event, i) => {
                const Icon = eventIcons[event.type];
                const color = eventColors[event.type];
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex gap-2.5 rounded-lg p-2 hover:bg-secondary/50 transition-colors"
                  >
                    <div className={`mt-0.5 shrink-0 ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{event.title}</p>
                      {event.detail && (
                        <p className="text-[10px] text-muted-foreground truncate">{event.detail}</p>
                      )}
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {event.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                        {event.auth0Feature && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">
                            {event.auth0Feature}
                          </Badge>
                        )}
                        {event.status === "denied" && (
                          <Badge variant="destructive" className="text-[9px] h-4 px-1">Denied</Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {events.length === 0 && (
              <div className="flex flex-col items-center py-8 text-center">
                <Shield className="h-6 w-6 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Events will appear here as you interact with the agent.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
