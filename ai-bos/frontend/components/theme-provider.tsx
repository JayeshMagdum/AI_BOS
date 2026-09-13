"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Re-exports next-themes' ThemeProvider as a named "use client" boundary.
 * This wrapper is required so that Server Components (like RootLayout) can
 * render a client-only provider without the "missing from React Client Manifest"
 * bundler error.
 *
 * Typed via ComponentProps<typeof NextThemesProvider> instead of the
 * next-themes/dist/types deep import — that sub-path exports nothing at
 * runtime and confuses the App Router bundler.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
