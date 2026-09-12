import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border px-6">
      <div />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {/* User menu is added in Step 2 once auth exists */}
      </div>
    </header>
  );
}
