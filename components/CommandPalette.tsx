"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, Home, FileText, Settings, Moon, Sun, Plus, LogOut, Terminal, Folder, Shield, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
    KBarProvider,
    KBarPortal,
    KBarPositioner,
    KBarAnimator,
    KBarSearch,
    KBarResults,
    useMatches
} from "kbar";

import { useLanguage } from "./LanguageProvider";

export default function CommandPalette({ children, isAdmin: propIsAdmin }: { children: React.ReactNode, isAdmin?: boolean }) {
    const router = useRouter();
    const { setTheme, theme } = useTheme();
    const { t } = useLanguage();
    const { data: session } = useSession();

    const isAdmin = propIsAdmin || session?.user?.role === "ADMIN";

    const actions = [
        // Navigation
        {
            id: "home",
            name: t('commandPalette.actions.home'),
            shortcut: ["h"],
            keywords: "dashboard index start",
            section: t('commandPalette.sections.navigation'),
            perform: () => router.push("/"),
            icon: <Home size={18} />,
        },
        {
            id: "settings",
            name: t('commandPalette.actions.settings'),
            shortcut: ["s"],
            keywords: "config preferences account",
            section: t('commandPalette.sections.navigation'),
            perform: () => router.push("/settings"),
            icon: <Settings size={18} />,
        },
        {
            id: "help",
            name: t('commandPalette.actions.help'),
            keywords: "docs documentation faq",
            section: t('commandPalette.sections.navigation'),
            perform: () => router.push("/help"),
            icon: <Terminal size={18} />,
        },
        // Admin Actions (Conditional)
        ...(isAdmin ? [
            {
                id: "admin-settings",
                name: t('commandPalette.actions.adminSettings') || "Global Settings",
                keywords: "admin registration private global",
                section: t('commandPalette.sections.admin') || "Administration",
                perform: () => router.push("/settings#admin"),
                icon: <Shield size={18} className="text-red-500" />,
            },
            {
                id: "user-management",
                name: t('commandPalette.actions.userManagement') || "User Management",
                keywords: "admin users role delete create",
                section: t('commandPalette.sections.admin') || "Administration",
                perform: () => router.push("/settings#users"),
                icon: <Users size={18} className="text-red-500" />,
            }
        ] : []),
        // Quick Actions
        {
            id: "create-prompt",
            name: t('commandPalette.actions.createPrompt'),
            shortcut: ["c", "p"],
            keywords: "new add prompt",
            section: t('commandPalette.sections.actions'),
            perform: () => router.push("/prompts/new"),
            icon: <Plus size={18} />,
        },
        {
            id: "create-collection",
            name: t('commandPalette.actions.createCollection'),
            shortcut: ["c", "c"],
            keywords: "new folder category",
            section: t('commandPalette.sections.actions'),
            perform: () => router.push("/collections/new"),
            icon: <Folder size={18} />,
        },
        // Theme
        {
            id: "theme",
            name: t('commandPalette.actions.toggleTheme'),
            shortcut: ["t"],
            keywords: "dark light mode color",
            section: t('commandPalette.sections.preferences'),
            perform: () => setTheme(theme === "dark" ? "light" : "dark"),
            icon: theme === "dark" ? <Sun size={18} /> : <Moon size={18} />,
        },
        // Profile
        {
            id: "sign-out",
            name: t('common.signOut') || "Sign Out",
            keywords: "logout exit desk",
            section: t('commandPalette.sections.account') || "Account",
            perform: () => signOut(),
            icon: <LogOut size={18} className="text-red-500" />,
        },
    ];

    return (
        <KBarProvider actions={actions}>
            <KBarPortal>
                <KBarPositioner className="backdrop-blur-sm bg-black/50 z-50 fixed inset-0">
                    <KBarAnimator className="w-full max-w-xl bg-background border border-border rounded-xl shadow-2xl overflow-hidden p-2 text-foreground">
                        <div className="flex items-center gap-3 px-3 py-4 border-b border-border/50">
                            <Search size={20} className="text-muted-foreground" />
                            <KBarSearch className="flex-1 bg-transparent border-none outline-none text-lg text-foreground placeholder:text-muted-foreground/70" placeholder={t('commandPalette.placeholder')} />
                            <span className="text-xs font-mono text-muted-foreground border border-border px-1.5 py-0.5 rounded">ESC</span>
                        </div>
                        <RenderResults />
                    </KBarAnimator>
                </KBarPositioner>
            </KBarPortal>
            {children}
        </KBarProvider>
    );
}

function RenderResults() {
    const { results } = useMatches();

    return (
        <KBarResults
            items={results}
            onRender={({ item, active }) =>
                typeof item === "string" ? (
                    <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2 bg-muted/30">
                        {item}
                    </div>
                ) : (
                    <div
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer transition-colors ${active ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent hover:bg-muted/50"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`p-2 rounded-md ${active ? "bg-background text-primary shadow-sm" : "bg-muted text-muted-foreground"}`}>
                                {item.icon}
                            </span>
                            <div className="flex flex-col">
                                <span className={active ? "text-primary font-medium" : "text-foreground"}>
                                    {item.name}
                                </span>
                                {item.subtitle && (
                                    <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                                )}
                            </div>
                        </div>
                        {item.shortcut?.length && (
                            <div className="flex gap-1">
                                {item.shortcut.map((key) => (
                                    <kbd key={key} className="px-2 py-1 text-xs font-mono bg-background border border-border rounded shadow-sm text-foreground">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        )}
                    </div>
                )
            }
        />
    );
}
