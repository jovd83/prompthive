"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { MoreHorizontal, Plus, Edit2, Trash2, FolderPlus } from "lucide-react";
import { useLanguage } from "./LanguageProvider";

type ContextMenuProps = {
    isOpen: boolean;
    onClose: () => void;
    collectionId: string;
    isOwner: boolean;
};

export default function CollectionContextMenu({ isOpen, onClose, collectionId, isOwner }: ContextMenuProps) {
    const { t } = useLanguage();
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={ref}
            className="absolute right-2 top-6 z-50 w-48 bg-surface border border-border rounded-md shadow-lg p-1 text-sm animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col gap-0.5">
                <Link
                    href={`/prompts/new?collectionId=${collectionId}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors text-foreground/80"
                >
                    <Plus size={14} />
                    <span>New Prompt</span>
                </Link>
                <Link
                    href={`/collections/new?parentId=${collectionId}`}
                    onClick={onClose}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors text-foreground/80"
                >
                    <FolderPlus size={14} />
                    <span>New Collection</span>
                </Link>
                {isOwner && (
                    <>
                        <div className="h-px bg-border my-1" />
                        <Link
                            href={`/collections/${collectionId}?action=edit`}
                            onClick={onClose}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors text-foreground/80"
                        >
                            <Edit2 size={14} />
                            <span>Edit Collection</span>
                        </Link>
                        {/* 
                           We don't link directly to delete action to avoid accidents. 
                           User can delete from the Edit page which opens the menu. 
                           Or we could support action=delete 
                        */}
                    </>
                )}
            </div>
        </div>
    );
}
