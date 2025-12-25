"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, LogOut, FileText, ChevronRight, ChevronDown, Settings as SettingsIcon, HelpCircle, MoreHorizontal, Book, GitMerge, Heart } from "lucide-react";
import { signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect, useRef } from "react";
import { moveCollection } from "@/actions/collections";
import { movePrompt, bulkMovePrompts } from "@/actions/prompts";
import UserProfileDialog from "./UserProfileDialog";

import { computeRecursiveCounts } from '@/lib/collection-utils';
import { useLanguage } from "./LanguageProvider";

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

type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-new' | 'date-old' | 'count-desc';

const SortMenu = ({ onSort, onClose, currentSort }: { onSort: (opt: SortOption) => void; onClose: () => void; currentSort: SortOption }) => {
    const { t } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const options: { label: string; value: SortOption }[] = [
        { label: t('list.sort.az'), value: 'alpha-asc' },
        { label: t('list.sort.za'), value: 'alpha-desc' },
        { label: t('list.sort.newest'), value: 'date-new' },
        { label: t('list.sort.oldest'), value: 'date-old' },
        { label: t('list.sort.mostItems'), value: 'count-desc' },
    ];

    return (
        <div ref={ref} className="absolute right-2 top-8 z-50 w-40 bg-surface border border-border rounded-md shadow-lg p-1 text-sm">
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onSort(opt.value)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between ${currentSort === opt.value ? "text-primary font-medium bg-primary/5" : ""}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );
};

const CollectionTreeItem = ({ collection, level = 0, pathname, onError, currentUserId }: { collection: Collection, level?: number, pathname: string, onError: (msg: string) => void, currentUserId?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const hasChildren = collection.children && collection.children.length > 0;
    const isActive = pathname === `/collections/${collection.id}`;

    const isOwner = currentUserId ? collection.ownerId === currentUserId : false;

    useEffect(() => {
        if (isActive || pathname.startsWith(`/collections/${collection.id}/`)) {
            setIsOpen(true);
        }
    }, [pathname, collection.id, isActive]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("collectionId", collection.id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const draggedColId = e.dataTransfer.getData("collectionId");
        const draggedPromptId = e.dataTransfer.getData("promptId");
        const bulkPromptIds = e.dataTransfer.getData("bulkPromptIds");

        if (draggedColId && draggedColId !== collection.id) {
            try {
                await moveCollection(draggedColId, collection.id);
                onError("");
            } catch (error) {
                console.error("Failed to move collection:", error);
                onError("Failed to move collection. Check if you are moving a parent into a child.");
            }
        } else if (bulkPromptIds) {
            try {
                const ids = JSON.parse(bulkPromptIds);
                if (Array.isArray(ids) && ids.length > 0) {
                    await bulkMovePrompts(ids, collection.id);
                }
                onError("");
            } catch (error) {
                console.error("Failed to bulk move prompts:", error);
                onError("Failed to bulk move prompts.");
            }
        } else if (draggedPromptId) {
            try {
                await movePrompt(draggedPromptId, collection.id);
                onError("");
            } catch (error) {
                console.error("Failed to move prompt:", error);
                onError("Failed to move prompt.");
            }
        }
    };


    return (
        <div>
            <div
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer border border-transparent ${isActive ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:text-primary hover:bg-background"
                    } ${isDragOver ? "!border-primary bg-primary/5" : ""}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {hasChildren ? (
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }} className="p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded" aria-label="Toggle children">
                        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                ) : (
                    <span className="w-4" /> // Spacer
                )}
                <Link href={`/collections/${collection.id}`} className="flex-1 truncate text-sm">
                    {collection.title} <span className="text-muted-foreground text-xs">{collection.totalPrompts !== undefined ? `(${collection.totalPrompts})` : `(${collection._count?.prompts || 0})`}</span>
                </Link>

            </div>
            {isOpen && hasChildren && (
                <div>
                    {collection.children!.map(child => (
                        <CollectionTreeItem key={child.id} collection={child} level={level + 1} pathname={pathname} onError={onError} currentUserId={currentUserId} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({ tags = [], collections = [], unassignedCount = 0, user }: { tags?: Tag[], collections?: Collection[], unassignedCount?: number, user?: { id?: string, name?: string | null, email?: string | null, image?: string | null, role?: string } }) {
    const { t } = useLanguage();
    const pathname = usePathname();
    const [isRootDragOver, setIsRootDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Sort states
    const [tagSort, setTagSort] = useState<SortOption>('alpha-asc');
    const [colSort, setColSort] = useState<SortOption>('alpha-asc');
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [showColMenu, setShowColMenu] = useState(false);

    // Collapse states
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
    const [isTagsOpen, setIsTagsOpen] = useState(true);
    const [isSystemOpen, setIsSystemOpen] = useState(true);

    // Compute counts
    const countMap = computeRecursiveCounts(collections as any);

    // Build tree structure
    const buildTree = (items: Collection[]) => {
        const processedItems = Array.from(countMap.values());
        const rootItems: any[] = [];
        const lookup: Record<string, any> = {};

        processedItems.forEach(item => {
            lookup[item.id] = { ...item, children: [] };
        });

        processedItems.forEach(item => {
            if (item.parentId && lookup[item.parentId]) {
                lookup[item.parentId].children!.push(lookup[item.id]);
            } else {
                rootItems.push(lookup[item.id]);
            }
        });

        return rootItems;
    };

    const sortCollections = (nodes: any[], sortType: SortOption): any[] => {
        const sorted = [...nodes].sort((a, b) => {
            if (sortType === 'alpha-asc') return a.title.localeCompare(b.title);
            if (sortType === 'alpha-desc') return b.title.localeCompare(a.title);
            if (sortType === 'date-new') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortType === 'date-old') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            if (sortType === 'count-desc') return (b.totalPrompts || 0) - (a.totalPrompts || 0);
            return 0;
        });

        // Recursive sort for children
        sorted.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children = sortCollections(node.children, sortType);
            }
        });
        return sorted;
    };

    const collectionTree = sortCollections(buildTree(collections), colSort);

    const sortedTags = [...tags].sort((a, b) => {
        if (tagSort === 'alpha-asc') return a.name.localeCompare(b.name);
        if (tagSort === 'alpha-desc') return b.name.localeCompare(a.name);
        if (tagSort === 'date-new') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        if (tagSort === 'date-old') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (tagSort === 'count-desc') return (b._count?.prompts || 0) - (a._count?.prompts || 0);
        return 0;
    });

    // Check role from props or use empty string if undefined
    const isAdmin = user?.role === 'ADMIN';

    const links = [
        { href: "/", label: t('common.dashboard'), icon: LayoutDashboard },
        { href: "/favorites", label: t('common.favorites'), icon: Heart },
        { href: "/prompts/new", label: t('common.newPrompt'), icon: Plus },
        { href: "/workflows", label: t('common.workflows'), icon: GitMerge },
    ];

    const [width, setWidth] = useState(256);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resize = (e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX;
            if (newWidth > 150 && newWidth < 600) {
                setWidth(newWidth);
            }
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resize);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resize);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    const handleRootDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsRootDragOver(false);
        const draggedId = e.dataTransfer.getData("collectionId");
        const draggedPromptId = e.dataTransfer.getData("promptId");
        const bulkPromptIds = e.dataTransfer.getData("bulkPromptIds");

        if (draggedId) {
            try {
                await moveCollection(draggedId, null);
            } catch (error) {
                console.error("Failed to move collection to root:", error);
            }
        } else if (bulkPromptIds) {
            try {
                const ids = JSON.parse(bulkPromptIds);
                if (Array.isArray(ids) && ids.length > 0) {
                    await bulkMovePrompts(ids, null);
                }
            } catch (error) {
                console.error("Failed to bulk move prompts to root:", error);
            }
        } else if (draggedPromptId) {
            try {
                await movePrompt(draggedPromptId, null); // Move to unassigned
            } catch (error) {
                console.error("Failed to move prompt to root:", error);
            }
        }
    };

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
                        <div className="pt-4 mt-4 border-t border-border">
                            <div
                                className={`flex items-center justify-between px-2 mb-2 rounded transition-colors ${isRootDragOver ? "bg-primary/20" : ""}`}
                                onDragOver={(e) => { e.preventDefault(); setIsRootDragOver(true); }}
                                onDragLeave={() => setIsRootDragOver(false)}
                                onDrop={handleRootDrop}
                            >
                                <div className="flex-1 flex items-center justify-between relative">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsCollectionsOpen(!isCollectionsOpen); }}
                                            className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background"
                                            title={isCollectionsOpen ? "Collapse Collections" : "Expand Collections"}
                                        >
                                            {isCollectionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </button>
                                        <Link href="/collections" className="text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors">
                                            {t('common.collections')}
                                        </Link>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setShowColMenu(!showColMenu)}
                                            className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background"
                                            title="Sort Collections"
                                        >
                                            <MoreHorizontal size={14} />
                                        </button>
                                        <Link href="/collections/new" className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background" title="New Collection">
                                            <Plus size={14} />
                                        </Link>
                                    </div>
                                    {showColMenu && (
                                        <SortMenu
                                            currentSort={colSort}
                                            onSort={(s) => { setColSort(s); setShowColMenu(false); }}
                                            onClose={() => setShowColMenu(false)}
                                        />
                                    )}
                                </div>
                            </div>
                            {isCollectionsOpen && (
                                <div className="space-y-0.5">
                                    {error && (
                                        <div className="mx-2 mb-2 p-2 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs rounded border border-red-200 dark:border-red-800 animate-in fade-in slide-in-from-top-1 break-words">
                                            {error}
                                        </div>
                                    )}
                                    {collectionTree.map((col) => (
                                        <CollectionTreeItem key={col.id} collection={col} pathname={pathname} onError={setError} currentUserId={user?.id} />
                                    ))}
                                    {/* No Collection Item */}
                                    <div className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors cursor-pointer border border-transparent ${pathname === '/collections/unassigned' ? "bg-primary/10 text-primary font-medium" : "text-foreground/70 hover:text-primary hover:bg-background"}`}>
                                        <span className="w-4" /> {/* Spacer */}
                                        <Link href="/collections/unassigned" className="flex-1 truncate text-sm">
                                            {t('common.noCollections')} <span className="text-muted-foreground text-xs">({unassignedCount})</span>
                                        </Link>
                                    </div>

                                    {collections.length === 0 && unassignedCount === 0 && (
                                        <p className="px-2 text-xs text-muted-foreground italic">{t('common.noCollections')}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-border">
                            <div className="flex items-center justify-between px-2 mb-2 relative">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsTagsOpen(!isTagsOpen)}
                                        className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background"
                                        title={isTagsOpen ? "Collapse Tags" : "Expand Tags"}
                                    >
                                        {isTagsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                    <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.tags')}</h2>
                                </div>
                                <button
                                    onClick={() => setShowTagMenu(!showTagMenu)}
                                    className="text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-background"
                                    title="Sort Tags"
                                >
                                    <MoreHorizontal size={14} />
                                </button>
                                {showTagMenu && (
                                    <SortMenu
                                        currentSort={tagSort}
                                        onSort={(s) => { setTagSort(s); setShowTagMenu(false); }}
                                        onClose={() => setShowTagMenu(false)}
                                    />
                                )}
                            </div>
                            {isTagsOpen && (
                                <div className="flex flex-wrap gap-1 px-2">
                                    {sortedTags.map((tag) => (
                                        <Link
                                            key={tag.id}
                                            href={`/?tags=${tag.id}`}
                                            className="inline-block px-2 py-1 text-xs bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-full transition-colors truncate max-w-full"
                                            title={`${tag.name} (${tag._count?.prompts || 0})`}
                                        >
                                            #{tag.name}
                                        </Link>
                                    ))}
                                    {sortedTags.length === 0 && (
                                        <p className="text-xs text-muted-foreground italic">{t('common.noTags')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </nav>

            {!isCollapsed && (
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
                            <Link
                                href="/settings"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors ${isCollapsed ? "justify-center" : ""}`}
                                title={isCollapsed ? t('common.settings') : ""}
                            >
                                <SettingsIcon size={20} className="shrink-0" />
                                <span>{t('common.settings')}</span>
                            </Link>
                            <Link
                                href="/help"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors ${isCollapsed ? "justify-center" : ""}`}
                                title={isCollapsed ? t('common.help') : ""}
                            >
                                <HelpCircle size={20} className="shrink-0" />
                                <span>{t('common.help')}</span>
                            </Link>
                            <Link
                                href="/import-export"
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors ${isCollapsed ? "justify-center" : ""}`}
                                title={isCollapsed ? t('common.importExport') : ""}
                            >
                                <FileText size={20} className="shrink-0" />
                                <span>{t('common.importExport')}</span>
                            </Link>
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
            )}

            {/* Collapsed Icons Only - When sidebar is collapsed */}
            {isCollapsed && (
                <div className="mt-auto border-t border-border pt-2 space-y-1">
                    <Link
                        href="/settings"
                        className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors"
                        title={t('common.settings')}
                    >
                        <SettingsIcon size={20} className="shrink-0" />
                    </Link>
                    <Link
                        href="/help"
                        className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors"
                        title={t('common.help')}
                    >
                        <HelpCircle size={20} className="shrink-0" />
                    </Link>
                    <Link
                        href="/import-export"
                        className="flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background text-foreground/80 transition-colors"
                        title={t('common.importExport')}
                    >
                        <FileText size={20} className="shrink-0" />
                    </Link>
                    <div className="flex justify-center">
                        <ThemeToggle />
                    </div>
                </div>
            )}

            <div className="pt-2 mt-1 border-t border-border">
                <button
                    data-testid="user-profile-trigger"
                    onClick={() => setIsProfileOpen(true)}
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


            {/* Drag Handle */}
            <div
                className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
                onMouseDown={startResizing}
            />
        </aside >
    );
}
