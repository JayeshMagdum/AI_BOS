/**
 * recent-chats.tsx
 *
 * A list of recent AI chat sessions.
 * Displays title, last message excerpt, sources count, and relative timestamp.
 */
import Link from "next/link";
import { MessageSquare, FileSearch, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatRelativeTime(iso: string): string {
  if (!iso) return "just now";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (isNaN(diffMs)) return "recently";
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export interface GenericChatDisplay {
  id: string;
  title: string;
  lastMessage?: string | null;
  sources?: number;
  createdAt: string;
}

interface RecentChatsProps {
  chats: GenericChatDisplay[];
}

export function RecentChats({ chats }: RecentChatsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            Recent AI Chats
          </CardTitle>
          <CardDescription className="mt-0.5">
            {chats.length > 0 ? "Your latest conversations" : "No conversations yet"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/chat">New chat</Link>
        </Button>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-foreground">No recent conversations</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Ask questions to explore your uploaded documents.
            </p>
            <Button size="sm" variant="outline" asChild>
              <Link href="/chat">Start Chat</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/chat?id=${chat.id}`}
                  className="flex items-start gap-3 px-6 py-3 transition-colors hover:bg-muted/50"
                >
                  {/* Chat icon */}
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {chat.title}
                    </p>
                    {chat.lastMessage && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        &ldquo;{chat.lastMessage}&rdquo;
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileSearch className="h-3 w-3" />
                        {chat.sources ?? 0} source{(chat.sources ?? 0) !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(chat.createdAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
