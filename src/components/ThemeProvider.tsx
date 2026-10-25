"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Follows the visitor's OS setting until they choose otherwise; the choice is
// remembered. Transitions are suspended for the swap so every colour changes
// in the same frame instead of easing at its own speed.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
