import { Auth0Provider } from "@auth0/auth0-react";
import { fetchAuth0Config } from "@/lib/auth0-config";
import { useEffect, useState } from "react";

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<{ domain: string; clientId: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuth0Config().then((cfg) => {
      setConfig(cfg);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  if (!config?.domain || !config?.clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-2xl font-bold text-foreground">Auth0 Configuration Required</h1>
          <p className="text-muted-foreground">
            Set <code className="text-primary">VITE_AUTH0_DOMAIN</code> and{" "}
            <code className="text-primary">VITE_AUTH0_CLIENT_ID</code> environment variables to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
