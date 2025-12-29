"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown, Folder, Check, EyeOff } from "lucide-react";
import { computeRecursiveCounts } from "@/lib/collection-utils";
import { useRouter } from "next/navigation";

export type CollectionTreeProps = {
    collections: any[];
    mode?: "navigation" | "selection"; // 'navigation' for main page, 'selection' for settings
    checkedIds?: Set<string>; // For selection mode (hidden IDs)
    onToggle?: (id: string, checked: boolean) => void;
    currentUserId?: string;
};

type TreeNode = {
    id: string;
    title: string;
    parentId: string | null;
    children: TreeNode[];
    totalPrompts?: number;
    _count?: { prompts: number };
    ownerId?: string;
};

export default function CollectionTree({ collections = [], mode = "navigation", checkedIds, onToggle, currentUserId }: CollectionTreeProps) {
    const countMap = computeRecursiveCounts(collections);

    // Build Tree
    const buildTree = (items: any[]) => {
        const lookup: Record<string, TreeNode> = {};
        const rootItems: TreeNode[] = [];

        // First pass: create nodes
        items.forEach(item => {
            // Use countMap if available for accurate total counts
            const countInfo = countMap.get(item.id);
            lookup[item.id] = {
                ...item,
                children: [],
                totalPrompts: countInfo ? countInfo.totalPrompts : (item._count?.prompts || 0)
            };
        });

        // Second pass: link children
        items.forEach(item => {
            if (item.parentId && lookup[item.parentId]) {
                lookup[item.parentId].children.push(lookup[item.id]);
            } else {
                rootItems.push(lookup[item.id]);
            }
        });

        return rootItems;
    };

    const rootNodes = buildTree(collections);

    if (rootNodes.length === 0) {
        return <div className="text-muted-foreground italic p-4">No collections found.</div>;
    }

    return (
        <div className="space-y-1">
            {rootNodes.map(node => (
                <CollectionTreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    mode={mode}
                    checkedIds={checkedIds}
                    onToggle={onToggle}
                    currentUserId={currentUserId}
                />
            ))}
        </div>
    );
}

function CollectionTreeNode({
    node,
    level,
    mode,
    checkedIds,
    onToggle,
    currentUserId
}: {
    node: TreeNode,
    level: number,
    mode: "navigation" | "selection",
    checkedIds?: Set<string>,
    onToggle?: (id: string, checked: boolean) => void,
    currentUserId?: string
}) {
    const [isOpen, setIsOpen] = useState(true); // Default open?
    const hasChildren = node.children.length > 0;
    const isChecked = checkedIds?.has(node.id);

    const handleToggleCheck = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onToggle) {
            onToggle(node.id, !isChecked);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors ${mode === 'navigation' ? 'cursor-pointer' : ''}`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
            >
                {/* Expand/Collapse Toggle */}
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
                    className={`p-1 rounded hover:bg-muted text-muted-foreground ${!hasChildren ? 'invisible' : ''}`}
                >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {/* Mode Specific UI */}
                {mode === "selection" ? (
                    <div className="flex items-center gap-3 flex-1">
                        <div
                            onClick={handleToggleCheck}
                            className={`w-5 h-5 rounded border border-input flex items-center justify-center cursor-pointer transition-colors ${isChecked ? 'bg-primary border-primary text-primary-foreground' : 'bg-background hover:border-primary'}`}
                        >
                            {isChecked && <Check size={14} />}
                        </div>
                        <span className={`font-medium ${!isChecked ? 'text-muted-foreground/70' : ''}`}>
                            {node.title}
                        </span>
                        {!isChecked && (
                            <span className="text-xs text-muted-foreground border border-border px-1.5 py-0.5 rounded flex items-center gap-1">
                                <EyeOff size={10} />
                            </span>
                        )}
                    </div>
                ) : (
                    <Link href={`/collections/${node.id}`} className="flex items-center gap-2 flex-1 group">
                        <Folder className="text-primary/80 group-hover:text-primary transition-colors" size={18} />
                        <span className="font-medium group-hover:underline decoration-primary/30 underline-offset-4">{node.title}</span>
                        <span className="text-xs text-muted-foreground">({node.totalPrompts})</span>
                    </Link>
                )}
            </div>

            {/* Children */}
            {isOpen && hasChildren && (
                <div className="border-l border-border/40 ml-[15px]">
                    {node.children.map(child => (
                        <CollectionTreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            mode={mode}
                            checkedIds={checkedIds}
                            onToggle={onToggle}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
