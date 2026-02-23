import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { updateCollectionDetails, deleteCollection, emptyCollection, getCollectionDescendantsAction } from "@/actions/collections";
import { bulkDeletePrompts } from "@/actions/prompt-bulk";
import { CollectionWithPrompts } from "@/types/prisma";

export function useCollectionSidebar(collection: CollectionWithPrompts) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(collection.title);
    const [editDescription, setEditDescription] = useState(collection.description || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEmptying, setIsEmptying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number, total: number, message: string } | null>(null);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (searchParams.get("action") === "edit") {
            setIsEditing(true);
        }
    }, [searchParams]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsDeleting(false);
                setIsEmptying(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        setEditName(collection.title);
        setEditDescription(collection.description || "");
    }, [collection.title, collection.description]);

    const handleSaveDetails = async () => {
        if (!editName.trim()) return;
        try {
            await updateCollectionDetails(collection.id, editName, editDescription);
            setIsEditing(false);
            setIsMenuOpen(false);
            setError(null);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("Failed to update details:", msg);
            setError("Failed to update details: " + msg);
        }
    };

    const handleDelete = async (deletePrompts: boolean = false) => {
        try {
            if (!deletePrompts) {
                await deleteCollection(collection.id, false);
                router.replace(`/?deletedCollection=${encodeURIComponent(collection.title)}`);
                router.refresh();
                return;
            }

            setProgress({ current: 0, total: 100, message: "Analyzing..." });

            const { promptIds } = await getCollectionDescendantsAction(collection.id);
            const total = promptIds.length;

            if (total > 0) {
                const BATCH_SIZE = 20;
                let processed = 0;
                setProgress({ current: 0, total, message: "Deleting prompts..." });

                for (let i = 0; i < total; i += BATCH_SIZE) {
                    const batch = promptIds.slice(i, i + BATCH_SIZE);
                    await bulkDeletePrompts(batch);
                    processed += batch.length;
                    setProgress({ current: Math.min(processed, total), total, message: `Deleting prompts (${Math.min(processed, total)}/${total})...` });
                }
            }

            setProgress({ current: total, total: total || 1, message: "Cleaning up collections..." });
            await deleteCollection(collection.id, true);

            router.replace(`/?deletedCollection=${encodeURIComponent(collection.title)}`);
            router.refresh();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("Failed to delete collection:", msg);
            setError("Failed to delete collection: " + msg);
            setProgress(null);
        }
    };

    const handleEmpty = async () => {
        try {
            await emptyCollection(collection.id);
            setIsEmptying(false);
            setIsMenuOpen(false);
            setError(null);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error("Failed to empty collection:", msg);
            setError("Failed to empty collection: " + msg);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedPromptIds(new Set());
        setIsMenuOpen(false);
    };

    const togglePromptSelection = (id: string) => {
        const newSet = new Set(selectedPromptIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPromptIds(newSet);
    };

    const handleSelectAll = (promptIds: string[]) => {
        setSelectedPromptIds(new Set(promptIds));
    };

    const handleDeselectAll = () => {
        setSelectedPromptIds(new Set());
    };

    const handleBulkDragStart = (e: React.DragEvent, pId: string) => {
        if (selectedPromptIds.has(pId)) {
            e.dataTransfer.setData("bulkPromptIds", JSON.stringify(Array.from(selectedPromptIds)));
            e.dataTransfer.setData("text/plain", `${selectedPromptIds.size} prompts`);
        } else {
            e.dataTransfer.setData("promptId", pId);
        }
    };

    return {
        isMenuOpen, setIsMenuOpen,
        isEditing, setIsEditing,
        editName, setEditName,
        editDescription, setEditDescription,
        isDeleting, setIsDeleting,
        isEmptying, setIsEmptying,
        error, setError,
        progress,
        isSelectionMode, setIsSelectionMode,
        selectedPromptIds, setSelectedPromptIds,
        isTagModalOpen, setIsTagModalOpen,
        menuRef,
        handleSaveDetails,
        handleDelete,
        handleEmpty,
        toggleSelectionMode,
        togglePromptSelection,
        handleSelectAll,
        handleDeselectAll,
        handleBulkDragStart
    };
}
