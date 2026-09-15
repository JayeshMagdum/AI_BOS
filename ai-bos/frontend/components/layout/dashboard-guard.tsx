"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getToken } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setVerifying(false);
      router.replace("/login");
      return;
    }

    if (!user) {
      refreshUser().then((userData) => {
        if (!userData) {
          router.replace("/login");
        }
        setVerifying(false);
      });
    } else {
      setVerifying(false);
    }
  }, [user, refreshUser, router]);

  if (isLoading || verifying) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user && !getToken()) {
    return null;
  }

  return <>{children}</>;
}
