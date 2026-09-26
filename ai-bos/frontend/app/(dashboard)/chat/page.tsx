"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Send,
  Bot,
  User as UserIcon,
  FileText,
  ArrowRight,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  sendConversationMessage,
  getChatSuggestions,
  ConversationItem,
  ChatMessageItem,
  ChatSource,
  ApiError,
} from "@/lib/api";

function ChatInner() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("id");

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasDocuments, setHasDocuments] = useState<boolean>(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(true);

  // Load document-aware suggestions
  const loadSuggestions = async () => {
    try {
      setIsLoadingSuggestions(true);
      const res = await getChatSuggestions();
      setSuggestions(res.suggestions);
      setHasDocuments(res.has_documents);
    } catch (err) {
      console.error("Failed to load suggested queries:", err);
      setSuggestions([
        "What are the key takeaways from the uploaded documents?",
        "Summarize the latest document",
        "Extract notable numbers and findings",
        "Compare data across uploaded files",
      ]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Load user conversation list
  const loadConversations = async () => {
    try {
      const list = await getConversations();
      setConversations(list);
      return list;
    } catch (err) {
      console.error("Failed to load conversations:", err);
      return [];
    }
  };

  useEffect(() => {
    loadConversations();
    loadSuggestions();
  }, []);

  // Load messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingThread(true);

    getConversation(activeConvId)
      .then((detail) => {
        if (isMounted) {
          setMessages(detail.messages);
        }
      })
      .catch((err) => {
        console.error("Failed to load conversation details:", err);
        if (isMounted) setMessages([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingThread(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput("");
    loadSuggestions();
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSubmit = async (questionText: string) => {
    const question = questionText.trim();
    if (!question || isLoading) return;

    setInput("");
    setIsLoading(true);

    // Optimistic user message
    const tempUserMsg: ChatMessageItem = {
      id: crypto.randomUUID(),
      conversation_id: activeConvId ?? "",
      role: "user",
      content: question,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      let targetConvId = activeConvId;

      // If starting fresh without an active thread, create one first
      if (!targetConvId) {
        const words = question.split(" ");
        const autoTitle = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
        const newThread = await createConversation(autoTitle);
        targetConvId = newThread.id;
        setActiveConvId(targetConvId);
      }

      // Post message in conversation
      const aiResponse = await sendConversationMessage(targetConvId, question);
      setMessages((prev) => [...prev, aiResponse]);

      // Refresh sidebar list to update last message & timestamp
      loadConversations();
    } catch (err) {
      const errorDetail =
        err instanceof ApiError
          ? err.detail
          : "Failed to get a response. Make sure the backend and Qdrant are running.";

      const errMsg: ChatMessageItem = {
        id: crypto.randomUUID(),
        conversation_id: activeConvId ?? "",
        role: "assistant",
        content: errorDetail,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime())
      ? "just now"
      : d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Knowledge Chat</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Multi-turn contextual reasoning grounded strictly on your business documents.
          </p>
        </div>

        <Button variant="outline" size="sm" asChild>
          <Link href="/documents">
            <FileText className="h-4 w-4 mr-1.5" />
            Manage Documents
          </Link>
        </Button>
      </div>

      {/* ── Chat Container (Sidebar + Chat Area) ───────────── */}
      <div className="flex flex-1 rounded-2xl border border-border bg-card/60 backdrop-blur-sm overflow-hidden shadow-sm">
        {/* Thread Sidebar (desktop & tablet) */}
        <div className="w-72 border-r border-border bg-muted/20 flex flex-col shrink-0 hidden md:flex">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Conversations
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChat}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-40" />
                No conversation history yet. Start asking questions!
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs cursor-pointer transition-colors ${
                      isActive
                        ? "bg-primary/15 text-primary font-medium border border-primary/20"
                        : "hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="truncate">{conv.title}</p>
                      {conv.last_message && (
                        <p className="truncate text-[11px] text-muted-foreground mt-0.5 opacity-80">
                          {conv.last_message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 transition-opacity"
                      title="Delete thread"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Stream Main View */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Thread Header */}
          <div className="px-6 py-3 border-b border-border/80 flex items-center justify-between bg-card/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <h2 className="text-sm font-semibold truncate text-foreground">
                {activeConv ? activeConv.title : "New Knowledge Query"}
              </h2>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNewChat}
              className="md:hidden text-xs h-8"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoadingThread ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
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
                    <div className="text-xs text-muted-foreground pl-1">AI BOS • Ready</div>
                  </div>
                </div>

                {/* Suggestion prompts */}
                <div className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {hasDocuments ? "Suggested queries for your documents:" : "Suggested queries to get started:"}
                    </p>
                    {hasDocuments && (
                      <span className="text-[10px] text-primary/90 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-medium">
                        Tailored to your files
                      </span>
                    )}
                  </div>
                  {isLoadingSuggestions ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-10 rounded-xl border border-border/60 bg-muted/20 animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {suggestions.map((prompt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSubmit(prompt)}
                          disabled={isLoading}
                          className="group flex items-center justify-between rounded-xl border border-border/80 bg-background/50 px-4 py-2.5 text-left text-xs text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-muted/40 hover:shadow-sm disabled:opacity-50"
                        >
                          <span className="truncate mr-2 group-hover:text-primary transition-colors">{prompt}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className="flex gap-3 max-w-3xl">
                    {/* Avatar */}
                    <div
                      className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl border text-xs font-semibold ${
                        isUser
                          ? "bg-foreground/5 text-foreground border-border"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {isUser ? <UserIcon className="h-4.5 w-4.5" /> : <Bot className="h-5 w-5" />}
                    </div>

                    {/* Message content */}
                    <div className="space-y-2 min-w-0 flex-1">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          isUser
                            ? "rounded-tl-sm bg-primary/10 border border-primary/20 text-foreground"
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
                            {msg.sources.map((src: any, i: number) => (
                              <div
                                key={i}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted transition-colors"
                                title={`Relevance: ${(src.relevance_score * 100).toFixed(1)}% — ${src.text_excerpt}`}
                              >
                                <FileText className="h-3 w-3 text-primary/70" />
                                <span className="font-medium text-foreground/80">
                                  {src.filename}
                                </span>
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
                          {isUser ? "You" : "AI BOS"} • {formatTime(msg.created_at)}
                        </span>
                        {msg.model && msg.model !== "none" && (
                          <span className="text-muted-foreground/50">via {msg.model}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-2xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-secondary/50 border border-border/60 px-4 py-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Analyzing documents and generating answer...</span>
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
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatInner />
    </Suspense>
  );
}
