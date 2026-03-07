"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Folder, FolderOpen } from "lucide-react";
import { moveCollection } from "@/actions/collections";
import { movePrompt, bulkMovePrompts } from "@/actions/prompt-bulk";

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

type ItemProps = {
    collection: Collection;
    level?: number;
    pathname: string;
    onError: (msg: string) => void;
    currentUserId?: string;
    expandedIds?: Set<string>;
};

export const SidebarCollectionItem = ({ collection, level = 0, pathname, onError, currentUserId, expandedIds }: ItemProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const hasChildren = collection.children && collection.children.length > 0;
    const isActive = pathname === `/collections/${collection.id}`;

    useEffect(() => {
        if (isActive || pathname.startsWith(`/collections/${collection.id}/`) || expandedIds?.has(collection.id)) {
            setIsOpen(true);
        }
    }, [pathname, collection.id, isActive, expandedIds]);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData("collectionId", collection.id);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent flickering when dragging over children
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }

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
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("Failed to move collection:", msg);
                onError("Failed to move collection: " + msg);
            }
        } else if (bulkPromptIds) {
            try {
                const ids = JSON.parse(bulkPromptIds);
                if (Array.isArray(ids) && ids.length > 0) {
                    await bulkMovePrompts(ids, collection.id);
                }
                onError("");
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("Failed to bulk move prompts:", msg);
                onError("Failed to bulk move prompts: " + msg);
            }
        } else if (draggedPromptId) {
            try {
                await movePrompt(draggedPromptId, collection.id);
                onError("");
            } catch (error: unknown) {
                const msg = error instanceof Error ? error.message : String(error);
                console.error("Failed to move prompt:", msg);
                onError("Failed to move prompt: " + msg);
            }
        }
    };

    return (
        <div>
            <div
                draggable
                data-collection-id={collection.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer border border-transparent mb-0.5 ${isActive
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "text-foreground/70 hover:bg-primary/10 hover:text-primary"
                    } ${isDragOver ? "!border-primary bg-primary/20 scale-[1.05] z-10" : ""}`}
                style={{ marginLeft: `${level * 12}px` }}
            >
                <div className="flex items-center gap-1 min-w-[20px]">
                    {hasChildren ? (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                            className={`p-0.5 rounded transition-colors ${isActive ? "hover:bg-primary-foreground/20" : "hover:bg-primary/20"}`}
                            aria-label="Toggle children"
                            data-testid="collection-toggle"
                        >
                            {isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                        </button>
                    ) : (
                        <div className="w-4" />
                    )}
                </div>

                <div className={`shrink-0 transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}>
                    {isOpen ? (
                        <FolderOpen size={16} className={isActive ? "text-primary-foreground text-white" : "text-primary/70"} />
                    ) : (
                        <Folder size={16} className={isActive ? "text-primary-foreground text-white" : "text-primary/70"} />
                    )}
                </div>

                <Link href={`/collections/${collection.id}`} className="flex-1 truncate text-sm font-medium">
                    {collection.title}
                </Link>

                <span className={`text-[10px] tabular-nums font-bold px-1.5 py-0.5 rounded-full transition-colors ${isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    }`}>
                    {collection.totalPrompts !== undefined ? collection.totalPrompts : (collection._count?.prompts || 0)}
                </span>
            </div>
            {isOpen && hasChildren && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-200">
                    {collection.children!.map(child => (
                        <SidebarCollectionItem key={child.id} collection={child} level={level + 1} pathname={pathname} onError={onError} currentUserId={currentUserId} expandedIds={expandedIds} />
                    ))}
                </div>
            )}
        </div>
    );
};
