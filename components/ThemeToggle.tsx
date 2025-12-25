"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-background transition-colors text-foreground/80"
        >
            {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
            <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
        </button>
    );
}
