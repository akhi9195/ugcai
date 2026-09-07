import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { dark } from "@clerk/themes";
import { useTheme } from "./ThemeContext";

const PUBLISHABE_KEY = import.meta.env.VITE_CLERK_PLUBLISHABLE_KEY;

export function ClerkWithTheme({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        theme: theme === "dark" ? dark : undefined,
        variables: {
          colorPrimary: "var(--color-btn-primary)",
          colorPrimaryForeground: "var(--color-btn-primary-foreground)",
        },
      }}
      publishableKey={PUBLISHABE_KEY}
    >
      {children}
    </ClerkProvider>
  );
}
