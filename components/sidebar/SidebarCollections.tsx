"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { SidebarCollectionItem } from "./SidebarCollectionItem";
import { useLanguage } from "@/components/LanguageProvider";
import { moveCollection } from "@/actions/collections";
import { movePrompt, bulkMovePrompts } from "@/actions/prompts";
import { computeRecursiveCounts } from '@/lib/collection-utils';

type SortOption = 'alpha-asc' | 'alpha-desc' | 'date-new' | 'date-old' | 'count-desc';

const CollectionOptionsMenu = ({
    onSort,
    onClose,
    currentSort,
    onError
}: {
    onSort: (opt: SortOption) => void;
    onClose: () => void;
    currentSort: SortOption;
    onError: (msg: string) => void;
}) => {
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
        <div ref={ref} className="absolute right-2 top-8 z-50 w-48 bg-surface border border-border rounded-md shadow-lg p-1 text-sm">
            <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t('common.sort')}
            </div>
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

export const SidebarCollections = ({
    collections = [],
    unassignedCount = 0,
    pathname,
    expandedIds,
    onError,
    currentUserId
}: {
    collections?: any[],
    unassignedCount?: number,
    pathname: string,
    expandedIds: Set<string>,
    onError: (msg: string) => void,
    currentUserId?: string
}) => {
    const { t } = useLanguage();
    const [isCollectionsOpen, setIsCollectionsOpen] = useState(true);
    const [showColMenu, setShowColMenu] = useState(false);
    const [colSort, setColSort] = useState<SortOption>('alpha-asc');
    const [isRootDragOver, setIsRootDragOver] = useState(false);

    // Tree Logic
    const countMap = computeRecursiveCounts(collections);

    const buildTree = (items: any[]) => {
        const processedItems = Array.from(countMap.values());
        const rootItems: any[] = [];
        const lookup: Record<string, any> = {};
        processedItems.forEach(item => lookup[item.id] = { ...item, children: [] });
        processedItems.forEach(item => {
            if (item.parentId && lookup[item.parentId]) lookup[item.parentId].children!.push(lookup[item.id]);
            else rootItems.push(lookup[item.id]);
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
        sorted.forEach(node => { if (node.children?.length) node.children = sortCollections(node.children, sortType); });
        return sorted;
    };

    const collectionTree = sortCollections(buildTree(collections), colSort);

    // Dnd Logic
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
                onError(error instanceof Error ? error.message : (t('errors.moveFailed') || "Move failed"));
            }
        } else if (bulkPromptIds) {
            try {
                const ids = JSON.parse(bulkPromptIds);
                if (Array.isArray(ids) && ids.length > 0) {
                    await bulkMovePrompts(ids, null);
                }
            } catch (error) {
                console.error("Failed to bulk move prompts to root:", error);
                onError(t('errors.moveFailed'));
            }
        } else if (draggedPromptId) {
            try {
                await movePrompt(draggedPromptId, null); // Move to unassigned
            } catch (error) {
                console.error("Failed to move prompt to root:", error);
                onError(t('errors.moveFailed'));
            }
        }
    };

    return (
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
                        <CollectionOptionsMenu
                            currentSort={colSort}
                            onSort={(s) => { setColSort(s); setShowColMenu(false); }}
                            onClose={() => setShowColMenu(false)}
                            onError={onError}
                        />
                    )}
                </div>
            </div>
            {isCollectionsOpen && (
                <div className="space-y-0.5">
                    {collectionTree.map((col) => (
                        <SidebarCollectionItem key={col.id} collection={col} pathname={pathname} onError={onError} currentUserId={currentUserId} expandedIds={expandedIds} />
                    ))}
                    {/* Unassigned Item */}
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
    );
};
