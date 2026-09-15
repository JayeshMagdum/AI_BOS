"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Send, Bot, User as UserIcon, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");

  const suggestionPrompts = [
    "Summarize our latest financial report",
    "What are our key customer churn risk factors?",
    "Extract top product action items from meeting notes",
    "Compare Q2 and Q3 business growth rates",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Knowledge Chat</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ask complex business questions answered directly from your uploaded documents.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/documents">
            <FileText className="h-4 w-4 mr-1.5" />
            Manage Documents
          </Link>
        </Button>
      </div>

      {/* ── Chat Container ────────────────────────────────── */}
      <div className="flex flex-1 flex-col rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Initial Greeting */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Bot className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <div className="rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/60 px-4 py-3 text-sm text-foreground">
                <p>
                  Hello {user?.full_name?.split(" ")[0] ?? "there"}! I&apos;m your AI BOS business assistant.
                  I can analyze your uploaded documents, synthesize answers, and cite specific pages.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>RAG Engine ready for document vector retrieval.</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pl-1">AI BOS • Just now</div>
            </div>
          </div>

          {/* Quick Starter Suggestions */}
          <div className="pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Suggested queries:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {suggestionPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInput(prompt)}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-left text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
                >
                  <span className="truncate mr-2">{prompt}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-border bg-background/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!input.trim()) return;
              setInput("");
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about your business documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-xl border border-input bg-card/60 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button type="submit" size="sm" className="rounded-xl px-4 h-10">
              <Send className="h-4 w-4 mr-1.5" />
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
