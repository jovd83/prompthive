"use client";

import { Menu } from "lucide-react";

interface MobileHeaderProps {
    onMenuClick: () => void;
}

export const MobileHeader = ({ onMenuClick }: MobileHeaderProps) => {
    return (
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface text-foreground w-full shrink-0 h-[60px]" data-testid="mobile-header">
            <div className="flex items-center gap-2">
                <img src="/logo-light.png" alt="Logo" className="w-8 h-8 object-contain rounded-md dark:hidden" />
                <img src="/logo-dark.png" alt="Logo" className="w-8 h-8 object-contain rounded-md hidden dark:block" />
                <h1 className="text-xl font-bold">PromptHive</h1>
            </div>
            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-background rounded-md text-muted-foreground transition-colors"
                title="Open Menu"
                data-testid="mobile-menu-button"
            >
                <Menu size={24} />
            </button>
        </div>
    );
};
