"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import CommandPalette from "@/components/CommandPalette";

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const orig = console.error;
    console.error = (...args: any[]) => {
        if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) {
            return;
        }
        orig.apply(console, args);
    };
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
            </NextThemesProvider>
        </SessionProvider>
    );
}
