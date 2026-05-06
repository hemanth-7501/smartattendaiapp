import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, GraduationCap, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { SignInModal } from "@/components/ui/SignInModal";

const nav = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/parents", label: "For Parents" },
  { to: "/teachers", label: "For Teachers" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const { user, isSignedIn, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            SmartAttend<span className="text-primary">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-foreground bg-secondary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-foreground hover:bg-secondary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isSignedIn && user ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/dashboard" })}
                className="gap-1.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <div className="text-sm text-right">
                <p className="font-semibold">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role === "hod" ? "HOD" : user.role}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { signOut(); navigate({ to: "/" }); }}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSignInOpen(true)}
              >
                Sign in
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary shadow-elegant">
                <Link to="/contact">Get a demo</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-foreground bg-secondary" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="rounded-md px-3 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            {isSignedIn ? (
              <Button
                size="sm"
                className="mt-2 bg-gradient-primary gap-1.5"
                onClick={() => { setOpen(false); navigate({ to: "/dashboard" }); }}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Button>
            ) : (
              <Button asChild size="sm" className="mt-2 bg-gradient-primary">
                <Link to="/contact" onClick={() => setOpen(false)}>
                  Get a demo
                </Link>
              </Button>
            )}
          </nav>
        </div>
      )}

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} />
    </header>
  );
}
