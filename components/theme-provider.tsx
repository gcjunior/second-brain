"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
<<<<<<< HEAD
      defaultTheme="system"
      enableSystem
=======
      defaultTheme="light"
      enableSystem={false}
>>>>>>> origin/main
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
