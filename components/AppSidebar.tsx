"use client";
// Force file refresh

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Plus, Heart, GitMerge, ChevronRight, X } from "lucide-react";
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

interface SidebarProps {
    tags?: Tag[];
    collections?: Collection[];
    unassignedCount?: number;
    user?: { id?: string, name?: string | null, email?: string | null, image?: string | null, role?: string };
    showWorkflows?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ tags = [], collections = [], unassignedCount = 0, user, showWorkflows = false, isOpen = false, onClose }: SidebarProps) {
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
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
                aria-hidden="true"
                data-testid="sidebar-backdrop"
            />

            <aside
                className={`
                    bg-surface border-r border-border flex flex-col h-screen overflow-hidden group
                    fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
                    md:sticky md:top-0 md:translate-x-0 md:z-auto
                    ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"}
                `}
                style={{ width: isCollapsed ? "64px" : `${width}px` }}
                data-testid="sidebar"
            >
                <UserProfileDialog
                    isOpen={isProfileOpen}
                    onClose={() => setIsProfileOpen(false)}
                    user={user || {}}
                />

                <div className="p-4 border-b border-border flex items-center justify-between h-[73px] relative">
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 truncate">
                            <img src="/logo-light.png" alt="Logo" className="w-8 h-8 object-contain rounded-md dark:hidden" />
                            <img src="/logo-dark.png" alt="Logo" className="w-8 h-8 object-contain rounded-md hidden dark:block" />
                            <h1 className="text-xl font-bold flex items-center gap-2">
                                <span>MyPromptHive</span>
                            </h1>
                        </div>
                    )}

                    {/* Desktop Collapse Button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`hidden md:block p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors ${isCollapsed ? "mx-auto" : ""}`}
                        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isCollapsed ? <ChevronRight size={20} /> : <ChevronRight className="rotate-180" size={20} />}
                    </button>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors absolute right-4 top-1/2 -translate-y-1/2"
                        title="Close Sidebar"
                        data-testid="sidebar-close-button"
                    >
                        <X size={20} />
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
                                onClick={onClose} // Close sidebar on mobile when link is clicked
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

                {/* Drag Handle - Hidden on Mobile */}
                <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50 hidden md:block"
                    onMouseDown={startResizing}
                />
            </aside >
        </>
    );
}
