import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { homeFor } from "@/context/AuthContext";
import { cn, titleCase } from "@/lib/utils";
import type { Role } from "@/types";

const NAV: Record<Role | "PUBLIC", { to: string; label: string; end?: boolean }[]> = {
  SEEKER: [
    { to: "/seeker", label: "Dashboard", end: true },
    { to: "/seeker/assistant", label: "Next Opportunity" },
    { to: "/seeker/matches", label: "Matches" },
    { to: "/opportunities", label: "Explore", end: true },
    { to: "/seeker/applications", label: "Applications" },
    { to: "/seeker/profile", label: "Skill DNA" },
  ],
  ORGANISATION: [
    { to: "/org", label: "Dashboard", end: true },
    { to: "/org/new", label: "Post opportunity" },
    { to: "/opportunities", label: "Explore", end: true },
    { to: "/org/profile", label: "Profile" },
  ],
  ADMIN: [
    { to: "/admin", label: "Stats", end: true },
    { to: "/opportunities", label: "Explore", end: true },
  ],
  PUBLIC: [{ to: "/opportunities", label: "Explore opportunities", end: true }],
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const links = NAV[user?.role ?? "PUBLIC"];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground");

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Logo to={user ? homeFor(user.role) : "/"} />
          <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden items-center gap-2 sm:flex">
                  <Avatar name={user.name} className="size-8 text-xs" />
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{titleCase(user.role)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  aria-label="Log out"
                >
                  <LogOut aria-hidden /> <span className="hidden sm:inline">Log out</span>
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  Log in
                </NavLink>
                <NavLink to="/register" className={buttonVariants({ size: "sm" })}>
                  Get started
                </NavLink>
              </>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu">
              {open ? <X aria-hidden /> : <Menu aria-hidden />}
            </Button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Mobile" className="grid gap-1 border-t px-4 py-3 lg:hidden">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        SkillBridge · Opportunity without barriers · Bhubaneswar prototype
      </footer>
    </div>
  );
}

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 py-8", className)}>{children}</div>;
}
