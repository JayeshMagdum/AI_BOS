"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { askQuestion, ChatResponse, ChatSource, ApiError } from "@/lib/api";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  model?: string;
  timestamp: Date;
  isError?: boolean;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestionPrompts = [
    "Summarize our latest financial report",
    "What are the key takeaways from the uploaded documents?",
    "Extract action items from the meeting notes",
    "Compare the data across uploaded spreadsheets",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response: ChatResponse = await askQuestion(question.trim());

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.answer,
        sources: response.sources,
        model: response.model,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorDetail =
        err instanceof ApiError
          ? err.detail
          : "Failed to get a response. Make sure the backend and Qdrant are running.";

      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: errorDetail,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

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
          {/* AI greeting when no messages */}
          {messages.length === 0 && (
            <>
              <div className="flex gap-3 max-w-2xl">
                <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/60 px-4 py-3 text-sm text-foreground">
                    <p>
                      Hello{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}!
                      I&apos;m your AI BOS business assistant. I can analyze your uploaded
                      documents, synthesize answers, and cite specific sources.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Powered by RAG — Gemini + Qdrant vector retrieval</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pl-1">AI BOS • Just now</div>
                </div>
              </div>

              {/* Suggestion prompts */}
              <div className="pt-4">
                <p className="text-xs font-medium text-muted-foreground mb-3">
                  Suggested queries:
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestionPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSubmit(prompt)}
                      disabled={isLoading}
                      className="flex items-center justify-between rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-left text-xs text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40 disabled:opacity-50"
                    >
                      <span className="truncate mr-2">{prompt}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Message bubbles */}
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 max-w-3xl">
              {/* Avatar */}
              <div
                className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl border text-xs font-semibold ${
                  msg.role === "user"
                    ? "bg-foreground/5 text-foreground border-border"
                    : msg.isError
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : "bg-primary/10 text-primary border-primary/20"
                }`}
              >
                {msg.role === "user" ? (
                  <UserIcon className="h-4.5 w-4.5" />
                ) : msg.isError ? (
                  <AlertCircle className="h-4.5 w-4.5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>

              {/* Message content */}
              <div className="space-y-2 min-w-0 flex-1">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "rounded-tl-sm bg-primary/10 border border-primary/20 text-foreground"
                      : msg.isError
                      ? "rounded-tl-sm bg-destructive/10 border border-destructive/20 text-destructive"
                      : "rounded-tl-sm bg-secondary/50 border border-border/60 text-foreground"
                  }`}
                >
                  {msg.content}
                </div>

                {/* Source citations */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pl-1">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                      Sources ({msg.sources.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                          title={`Relevance: ${(src.relevance_score * 100).toFixed(1)}% — ${src.text_excerpt}`}
                        >
                          <FileText className="h-3 w-3 text-primary/70" />
                          <span className="font-medium text-foreground/80">{src.filename}</span>
                          <span className="text-muted-foreground/60">
                            #{src.chunk_index}
                          </span>
                          <span className="text-emerald-400 font-medium">
                            {(src.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pl-1 flex items-center gap-2">
                  <span>
                    {msg.role === "user" ? "You" : "AI BOS"} • {formatTime(msg.timestamp)}
                  </span>
                  {msg.model && msg.model !== "none" && msg.model !== "error" && (
                    <span className="text-muted-foreground/50">via {msg.model}</span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-2xl">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/60 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Searching documents and generating answer...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="border-t border-border bg-background/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about your business documents..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 rounded-xl border border-input bg-card/60 px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl px-4 h-10"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Ask
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
