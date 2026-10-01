import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 relative">
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-background/50 hover:bg-background/80 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
      {children}
    </div>
  );
}
