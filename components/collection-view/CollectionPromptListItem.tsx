"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";
import { PromptWithRelations } from "@/types/prisma";

interface CollectionPromptListItemProps {
    prompt: any; // Using any for now to match legacy usage, or better PromptWithRelations
    isSelected: boolean;
    onClick: () => void;
    onDragStart: (e: React.DragEvent) => void;
    isSelectionMode: boolean;
    isChecked: boolean;
    onToggleSelection: () => void;
    tagColorsEnabled?: boolean;
}

export default function CollectionPromptListItem({
    prompt,
    isSelected,
    onClick,
    onDragStart,
    isSelectionMode,
    isChecked,
    onToggleSelection,
    tagColorsEnabled
}: CollectionPromptListItemProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        let content = "";
        if (prompt.versions && prompt.versions.length > 0) {
            content = prompt.versions[0].content;
        }

        if (!content) return;

        const success = await copyToClipboard(content);
        if (success) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);

            // Track analytics
            fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promptId: prompt.id, type: "copy" }),
            }).catch(console.error);
        }
    };

    return (
        <div
            data-prompt-id={prompt.id}
            draggable
            onDragStart={onDragStart}
            onClick={onClick}
            className={`group/item block p-3 rounded-lg border transition-all cursor-pointer relative ${isSelected
                ? "bg-primary/5 border-primary/50 shadow-sm"
                : "bg-card border-transparent hover:border-border hover:bg-background"
                } ${isChecked ? "bg-primary/5 border-primary/30" : ""}`}
        >
            <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {isSelectionMode && (
                        <div onClick={(e) => { e.stopPropagation(); onToggleSelection(); }} className="cursor-pointer text-primary">
                            {isChecked ? (
                                <div className="w-4 h-4 rounded border border-primary bg-primary text-primary-foreground flex items-center justify-center">
                                    <Check size={10} />
                                </div>
                            ) : (
                                <div className="w-4 h-4 rounded border border-muted-foreground/30 hover:border-primary"></div>
                            )}
                        </div>
                    )}
                    <h4 className={`font-medium text-sm mb-1 truncate ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {prompt.title}
                    </h4>
                </div>

                {/* Copy Button - Visible on hover or if copied */}
                {!isSelectionMode && (
                    <button
                        onClick={handleCopy}
                        className={`ml-1 p-1 rounded-md transition-all ${isCopied
                            ? "text-green-500 bg-green-500/10 opacity-100"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover/item:opacity-100"
                            }`}
                        title="Copy prompt content"
                    >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                )}
            </div>

            <div className={`flex flex-wrap gap-1 pr-6 ${isSelectionMode ? "pl-6" : ""}`}>
                {prompt.tags && prompt.tags.map((tag: any) => {
                    const style = tagColorsEnabled && tag.color ? {
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                        borderColor: `${tag.color}40`,
                    } : undefined;

                    return (
                        <Link
                            key={tag.id}
                            href={`/?tags=${tag.id}`}
                            className={`text-[10px] px-1.5 py-0.5 rounded-full transition-colors border ${!style ? "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground border-transparent" : "hover:brightness-90"}`}
                            style={style}
                            onClick={(e) => e.stopPropagation()}
                        >
                            #{tag.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
