"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Settings as SettingsIcon, HelpCircle, FileText } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { hasPermission } from "@/lib/permissions";
import ThemeToggle from "@/components/ThemeToggle";

export const SidebarSystemMenu = ({ isCollapsed, user }: { isCollapsed: boolean, user: any }) => {
    const { t } = useLanguage();
    const [isSystemOpen, setIsSystemOpen] = useState(true);

    if (isCollapsed) {
        return (
            <div className="mt-auto border-t border-border pt-2 space-y-1">
                <Link href="/settings" className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.settings')}>
                    <SettingsIcon size={20} className="shrink-0" />
                </Link>
                <Link href="/help" className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.help')}>
                    <HelpCircle size={20} className="shrink-0" />
                </Link>
                {hasPermission(user, 'import') && (
                    <Link href="/import-export" className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.importExport')}>
                        <FileText size={20} className="shrink-0" />
                    </Link>
                )}
                <div className="flex justify-center">
                    <ThemeToggle />
                </div>
            </div>
        );
    }

    return (
        <div className="mt-auto pt-2 border-t border-border">
            <div className="flex items-center justify-between px-2 mb-2 relative">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsSystemOpen(!isSystemOpen)}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background"
                        title={isSystemOpen ? "Collapse System" : "Expand System"}
                    >
                        {isSystemOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.system')}</h2>
                </div>
            </div>
            {isSystemOpen && (
                <div className="space-y-1">
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors">
                        <SettingsIcon size={20} className="shrink-0" />
                        <span>{t('common.settings')}</span>
                    </Link>
                    <Link href="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors">
                        <HelpCircle size={20} className="shrink-0" />
                        <span>{t('common.help')}</span>
                    </Link>

                    {hasPermission(user, 'import') && (
                        <Link href="/import-export" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors">
                            <FileText size={20} className="shrink-0" />
                            <span>{t('common.importExport')}</span>
                        </Link>
                    )}
                    <ThemeToggle />
                    <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 rounded-md border border-border/50 text-xs text-muted-foreground group cursor-pointer hover:bg-muted/60 transition-colors mx-0"
                        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }))}
                        title={t('common.search')}
                    >
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                            {t('common.search')}
                        </span>
                        <div className="flex gap-1 opacity-70">
                            <kbd className="font-mono bg-background border border-border px-1 rounded">⌘</kbd>
                            <kbd className="font-mono bg-background border border-border px-1 rounded">K</kbd>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SidebarUserMenu = ({ isCollapsed, user, onProfileClick }: { isCollapsed: boolean, user: any, onProfileClick: () => void }) => {
    return (
        <div className="pt-2 mt-1 border-t border-border">
            <button
                data-testid="user-profile-trigger"
                onClick={onProfileClick}
                className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-background text-foreground/80 transition-colors ${isCollapsed ? "justify-center" : ""}`}
                title={isCollapsed ? "User Profile" : ""}
            >
                {user?.image ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border shrink-0">
                        <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">{user?.name?.[0]?.toUpperCase() || "U"}</span>
                    </div>
                )}
                {!isCollapsed && <span className="truncate">{user?.name || "User"}</span>}
            </button>
        </div>
    );
};
