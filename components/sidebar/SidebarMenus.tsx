"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Settings as SettingsIcon, HelpCircle, FileText, Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { hasPermission } from "@/lib/permissions";
import ThemeToggle from "@/components/ThemeToggle";

export const SidebarSystemMenu = ({ isCollapsed, user }: { isCollapsed: boolean, user: any }) => {
    const { t } = useLanguage();
    const [isSystemOpen, setIsSystemOpen] = useState(true);

    if (isCollapsed) {
        return (
            <div className="mt-auto border-t border-border pt-2 space-y-1">
                <Link href="/settings" className="flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.settings')}>
                    <SettingsIcon size={20} className="shrink-0" />
                </Link>
                <Link href="/help" className="flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.help')}>
                    <HelpCircle size={20} className="shrink-0" />
                </Link>
                {hasPermission(user, 'import') && (
                    <Link href="/import-export" className="flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors" title={t('common.importExport')}>
                        <FileText size={20} className="shrink-0" />
                    </Link>
                )}
                <div className="flex justify-center scale-90">
                    <ThemeToggle />
                </div>
                <button
                    onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }))}
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors w-full"
                    title={t('common.search')}
                >
                    <Search size={20} className="shrink-0" />
                </button>
            </div>
        );
    }

    return (
        <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center justify-between px-4 mb-2 relative">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsSystemOpen(!isSystemOpen)}
                        className="text-muted-foreground hover:text-primary transition-all p-0.5 rounded hover:bg-background"
                        title={isSystemOpen ? "Collapse System" : "Expand System"}
                    >
                        {isSystemOpen ? <ChevronDown size={14} className="opacity-70" /> : <ChevronRight size={14} className="opacity-70" />}
                    </button>
                    <h2 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{t('common.system')}</h2>
                </div>
            </div>
            {isSystemOpen && (
                <div className="space-y-1 px-2 animate-fade-in">
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/80 transition-all duration-200 group">
                        <SettingsIcon size={18} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        <span className="text-sm font-medium">{t('common.settings')}</span>
                    </Link>
                    <Link href="/help" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/80 transition-all duration-200 group">
                        <HelpCircle size={18} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        <span className="text-sm font-medium">{t('common.help')}</span>
                    </Link>

                    {hasPermission(user, 'import') && (
                        <Link href="/import-export" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 hover:text-primary text-foreground/80 transition-all duration-200 group">
                            <FileText size={18} className="shrink-0 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                            <span className="text-sm font-medium">{t('common.importExport')}</span>
                        </Link>
                    )}

                    <ThemeToggle />

                    <div className="mt-2 px-1 pb-2">
                        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg border border-border/50 text-[11px] text-muted-foreground group cursor-pointer hover:bg-muted/60 hover:border-primary/30 transition-all mx-0 shadow-sm"
                            onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }))}
                        >
                            <span className="flex items-center gap-2">
                                <Search size={14} className="opacity-60 group-hover:text-primary group-hover:opacity-100 transition-all" />
                                <span className="group-hover:text-foreground transition-colors">{t('common.search')}</span>
                            </span>
                            <div className="flex gap-1.5">
                                <kbd className="font-sans bg-background/50 border border-border/50 px-1.5 py-0.5 rounded text-[10px] shadow-sm font-bold opacity-80 group-hover:opacity-100 group-hover:border-primary/20 transition-all">⌘</kbd>
                                <kbd className="font-sans bg-background/50 border border-border/50 px-1.5 py-0.5 rounded text-[10px] shadow-sm font-bold opacity-80 group-hover:opacity-100 group-hover:border-primary/20 transition-all">K</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const SidebarUserMenu = ({ isCollapsed, user, onProfileClick }: { isCollapsed: boolean, user: any, onProfileClick: () => void }) => {
    return (
        <div className="pt-2 pb-4 mt-auto border-t border-border bg-gradient-to-t from-background/50 to-transparent">
            <button
                data-testid="user-profile-trigger"
                onClick={onProfileClick}
                className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl hover:bg-primary/10 group transition-all duration-300 ${isCollapsed ? "justify-center" : "px-4"}`}
                title={isCollapsed ? "User Profile" : ""}
            >
                <div className="relative shrink-0">
                    {user?.image ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-border group-hover:border-primary/50 transition-colors shadow-sm">
                            <img src={user.image} alt={user.name || "User"} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-transparent group-hover:border-primary/20 transition-all shadow-inner">
                            <span className="text-xs font-bold text-primary">{user?.name?.[0]?.toUpperCase() || "U"}</span>
                        </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full shadow-sm"></div>
                </div>
                {!isCollapsed && (
                    <div className="flex flex-col items-start overflow-hidden text-left">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate w-full">{user?.name || "User"}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100 transition-opacity">{user?.role || "Member"}</span>
                    </div>
                )}
            </button>
        </div>
    );
};
