import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";


interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth0();

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <header className="border-b border-border/50 h-16 flex items-center px-4 gap-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
              <ThemeToggle />
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </header>
          {/* Page content */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
