"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Plus, Heart, GitMerge, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import UserProfileDialog from "./UserProfileDialog";
import { useSidebarResize } from "@/components/sidebar/useSidebarResize";
import { useLanguage } from "./LanguageProvider";
import { hasPermission } from "@/lib/permissions";
import { SidebarCollections } from "@/components/sidebar/SidebarCollections";
import { SidebarTags } from "@/components/sidebar/SidebarTags";
import { SidebarSystemMenu, SidebarUserMenu } from "@/components/sidebar/SidebarMenus";

type Collection = {
    id: string;
    title: string;
    parentId: string | null;
    children?: Collection[];
    _count?: { prompts: number };
    totalPrompts?: number;
    createdAt: Date | string;
    ownerId?: string;
};

type Tag = {
    id: string;
    name: string;
    createdAt?: Date | string;
    _count?: { prompts: number };
};

export default function Sidebar({ tags = [], collections = [], unassignedCount = 0, user, showWorkflows = false }: { tags?: Tag[], collections?: Collection[], unassignedCount?: number, user?: { id?: string, name?: string | null, email?: string | null, image?: string | null, role?: string }, showWorkflows?: boolean }) {
    console.log('[Sidebar] render showWorkflows:', showWorkflows);
    const { t } = useLanguage();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Resize Logic
    const { width, isResizing, startResizing } = useSidebarResize();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Auto-expansion logic
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const expandedColId = searchParams.get('expandedCollectionId');
        if (expandedColId && collections) {
            const newExpanded = new Set<string>();
            let currentId = expandedColId;
            const colMap = new Map(collections.map(c => [c.id, c]));
            while (currentId) {
                newExpanded.add(currentId);
                const col = colMap.get(currentId);
                currentId = col?.parentId || "";
            }
            setExpandedIds(prev => {
                const next = new Set(prev);
                newExpanded.forEach(id => next.add(id));
                return next;
            });
        }
    }, [searchParams, collections]);

    const [error, setError] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const canCreatePrompt = hasPermission(user, 'create:prompt');
    const links = [
        { href: "/", label: t('common.dashboard'), icon: LayoutDashboard },
        { href: "/favorites", label: t('common.favorites'), icon: Heart },
        // Hide New Prompt for Guests
        ...(canCreatePrompt ? [{ href: "/prompts/new", label: t('common.newPrompt'), icon: Plus }] : []),
        ...(showWorkflows ? [{ href: "/workflows", label: t('common.workflows'), icon: GitMerge }] : []),
    ];

    return (
        <aside
            className="border-r border-border bg-surface flex flex-col h-screen sticky top-0 overflow-hidden relative group"
            style={{ width: isCollapsed ? "64px" : `${width}px`, transition: isResizing ? "none" : "width 0.3s ease" }}
        >
            <UserProfileDialog
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                user={user || {}}
            />

            <div className="p-4 border-b border-border flex items-center justify-between h-[73px]">
                {!isCollapsed && (
                    <div className="flex items-center gap-2 truncate">
                        <img src="/logo-light.png" alt="Logo" className="w-8 h-8 object-contain rounded-md dark:hidden" />
                        <img src="/logo-dark.png" alt="Logo" className="w-8 h-8 object-contain rounded-md hidden dark:block" />
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <span>PromptHive</span>
                        </h1>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors ${isCollapsed ? "mx-auto" : ""}`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronRight className="rotate-180" size={20} />}
                </button>
            </div>

            <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-background text-foreground/80"
                                } ${isCollapsed ? "justify-center" : ""}`}
                            title={isCollapsed ? link.label : ""}
                        >
                            <Icon size={20} className="shrink-0" />
                            {!isCollapsed && <span>{link.label}</span>}
                        </Link>
                    );
                })}

                {!isCollapsed && (
                    <>
                        {error && (
                            <div className="mx-2 mt-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-1 break-words">
                                {error}
                            </div>
                        )}
                        <SidebarCollections
                            collections={collections}
                            unassignedCount={unassignedCount}
                            pathname={pathname}
                            expandedIds={expandedIds}
                            onError={setError}
                            currentUserId={user?.id}
                        />

                        <SidebarTags tags={tags} />
                    </>
                )}
            </nav>

            <SidebarSystemMenu isCollapsed={isCollapsed} user={user} />
            <SidebarUserMenu isCollapsed={isCollapsed} user={user} onProfileClick={() => setIsProfileOpen(true)} />

            {/* Drag Handle */}
            <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
                onMouseDown={startResizing}
            />
        </aside >
    );
}
