"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import { moveCollection } from "@/actions/collections";
import { movePrompt, bulkMovePrompts } from "@/actions/prompts";

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
            } catch (error) {
                console.error("Failed to move collection:", error);
                onError(error instanceof Error ? error.message : "Failed to move collection.");
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
                data-collection-id={collection.id}
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
                        <SidebarCollectionItem key={child.id} collection={child} level={level + 1} pathname={pathname} onError={onError} currentUserId={currentUserId} expandedIds={expandedIds} />
                    ))}
                </div>
            )}
        </div>
    );
};
