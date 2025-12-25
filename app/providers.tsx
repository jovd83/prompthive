"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import CommandPalette from "@/components/CommandPalette";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <CommandPalette>
                    {children}
                </CommandPalette>
            </ThemeProvider>
        </SessionProvider>
    );
}
