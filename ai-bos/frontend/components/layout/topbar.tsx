"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card/40 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </span>
        <span className="text-xs text-muted-foreground/50">/</span>
        <span className="text-xs font-semibold text-foreground">AI BOS Platform</span>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />

        {user && (
          <div className="flex items-center gap-3 pl-2 border-l border-border">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                {getInitials(user.full_name)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-medium leading-none text-foreground">
                  {user.full_name}
                </p>
                <p className="mt-0.5 text-[11px] leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
