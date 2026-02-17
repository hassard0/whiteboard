import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { DEMO_TEMPLATES } from "@/lib/demo-templates";
import { useAuth0ProfileSync } from "@/hooks/use-auth0-profile-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plane, Briefcase, ShoppingBag, Code, Wrench, Shield } from "lucide-react";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = {
  Plane, Briefcase, ShoppingBag, Code, Wrench,
};

export default function Dashboard() {
  const { user, logout } = useAuth0();
  const navigate = useNavigate();
  useAuth0ProfileSync();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-auth0">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Auth0 AI Demos</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Demo Launcher</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a demo to experience Auth0-secured AI agents in action.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEMO_TEMPLATES.map((template, i) => {
            const Icon = iconMap[template.icon] || Wrench;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card
                  className="group cursor-pointer transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                  onClick={() => navigate(`/demo/${template.id}`)}
                >
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${template.color}20` }}>
                      <Icon className="h-6 w-6" style={{ color: template.color }} />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.auth0Features.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-xs">
                          {f.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
