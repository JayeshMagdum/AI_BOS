"use client";

import { Upload, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function DashboardHeader() {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here&apos;s an overview of your business operating data and recent AI activities.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/documents">
            <Upload className="h-4 w-4 mr-1.5" />
            Upload
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/chat">
            <Sparkles className="h-4 w-4 mr-1.5" />
            Ask AI
          </Link>
        </Button>
      </div>
    </div>
  );
}
