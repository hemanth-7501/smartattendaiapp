import { useAuth } from "@/context/AuthContext";
import { SignInModal } from "@/components/ui/SignInModal";
import { useState, useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setShowLogin(true);
    }
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground text-sm">Please sign in to access the dashboard.</p>
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant transition hover:opacity-90"
          >
            Sign In
          </button>
        </div>
        <SignInModal open={showLogin} onOpenChange={setShowLogin} />
      </div>
    );
  }

  return <>{children}</>;
}
