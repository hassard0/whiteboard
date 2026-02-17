import { Auth0Provider } from "@auth0/auth0-react";
import { auth0Config } from "@/lib/auth0-config";

export function Auth0ProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!auth0Config.domain || !auth0Config.clientId) {
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
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={{
        redirect_uri: auth0Config.redirectUri,
      }}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
