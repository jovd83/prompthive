"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Folder, Plus, Check, X, MoreVertical, Edit2, Layers, FileText, Trash2, CheckSquare, Square, Tag as TagIcon, Move } from "lucide-react";
import SortControls from "@/components/SortControls";
import CollectionPromptListItem from "./CollectionPromptListItem";
import TagSelector from "@/components/TagSelector";
import { updateCollectionDetails, deleteCollection, emptyCollection, moveCollection } from "@/actions/collections";
import { bulkAddTags, movePrompt, bulkMovePrompts } from "@/actions/prompts";
import { useLanguage } from "@/components/LanguageProvider"; // Ensure correct path
import { CollectionWithPrompts, TagWithCount } from "@/types/prisma";

interface CollectionSidebarProps {
    collection: CollectionWithPrompts;
    promptId?: string;
    currentUserId: string;
    isGuest: boolean;
    tagColorsEnabled?: boolean;
    tags?: TagWithCount[];
}

export default function CollectionSidebar({
    collection,
    promptId,
    currentUserId,
    isGuest,
    tagColorsEnabled = true,
    tags = []
}: CollectionSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(collection.title);
    const [editDescription, setEditDescription] = useState(collection.description || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEmptying, setIsEmptying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Bulk Actions State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const isOwner = collection.ownerId === currentUserId;

    // Effects
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

    useEffect(() => {
        setError(null);
    }, [collection.id, promptId]);

    // Handlers
    const handleSaveDetails = async () => {
        if (!editName.trim()) return;
        try {
            await updateCollectionDetails(collection.id, editName, editDescription);
            setIsEditing(false);
            setIsMenuOpen(false);
            setError(null);
        } catch (error) {
            console.error("Failed to update details:", error);
            setError("Failed to update details.");
        }
    };

    const handleDelete = async (deletePrompts: boolean = false) => {
        try {
            await deleteCollection(collection.id, deletePrompts);
            router.replace(`/?deletedCollection=${encodeURIComponent(collection.title)}`);
            router.refresh();
        } catch (error) {
            console.error("Failed to delete collection:", error);
            setError("Failed to delete collection. Ensure it is empty if deleting safely.");
        }
    };

    const handleEmpty = async () => {
        try {
            await emptyCollection(collection.id);
            setIsEmptying(false);
            setIsMenuOpen(false);
            setError(null);
        } catch (error) {
            console.error("Failed to empty collection:", error);
            setError("Failed to empty collection.");
        }
    };

    // Bulk Handlers
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

    const handleBulkDragStart = (e: React.DragEvent, pId: string) => {
        if (selectedPromptIds.has(pId)) {
            e.dataTransfer.setData("bulkPromptIds", JSON.stringify(Array.from(selectedPromptIds)));
            e.dataTransfer.setData("text/plain", `${selectedPromptIds.size} prompts`);
        } else {
            e.dataTransfer.setData("promptId", pId);
        }
    };

    const handleSelectAll = () => {
        const allIds = collection.prompts.map((p: any) => p.id);
        setSelectedPromptIds(new Set(allIds));
    };

    const handleDeselectAll = () => {
        setSelectedPromptIds(new Set());
    };

    return (
        <>
            <div className="flex flex-col h-full">
                {/* Header Section */}
                <div className="p-4 border-b border-border min-w-[300px]">
                    <div className="mb-4">
                        {/* Breadcrumbs */}
                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Link href="/collections" className="hover:text-primary flex items-center gap-1">
                                Collections
                            </Link>
                            {collection.breadcrumbs && collection.breadcrumbs.map((crumb: any) => (
                                <div key={crumb.id} className="flex items-center">
                                    <span className="opacity-50 mx-1">/</span>
                                    <Link href={`/collections/${crumb.id}`} className="hover:text-primary">
                                        {crumb.title}
                                    </Link>
                                </div>
                            ))}
                        </div>

                        {/* Title & Actions */}
                        <div className="flex items-start justify-between gap-2">
                            {isEditing ? (
                                <div className="flex-1 flex flex-col gap-2 animate-in fade-in slide-in-from-left-1 duration-200 bg-background/50 p-2 rounded border border-primary/20">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full px-2 py-1 text-lg font-bold bg-background border border-primary rounded focus:outline-none"
                                        autoFocus
                                        placeholder="Collection Name"
                                    />
                                    <textarea
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary focus:outline-none resize-none"
                                        placeholder="Description (optional)"
                                        rows={2}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={handleSaveDetails} className="px-2 py-1 text-xs text-green-600 bg-green-500/10 hover:bg-green-500/20 rounded flex items-center gap-1 font-medium ring-1 ring-green-500/20"><Check size={12} /> Save</button>
                                        <button onClick={() => { setIsEditing(false); setEditName(collection.title); setEditDescription(collection.description || ""); }} className="px-2 py-1 text-xs text-red-600 bg-red-500/10 hover:bg-red-500/20 rounded flex items-center gap-1 font-medium ring-1 ring-red-500/20"><X size={12} /> Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-between group">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <h1 className="text-xl font-bold truncate" title={collection.title}>
                                            {collection.title} <span className="text-muted-foreground font-normal text-base">({collection.totalPrompts !== undefined ? collection.totalPrompts : (collection._count?.prompts || 0)})</span>
                                        </h1>
                                        {collection.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2" title={collection.description}>{collection.description}</p>}
                                    </div>

                                    {collection.id !== 'unassigned' && !isGuest && (
                                        <div className="relative" ref={menuRef}>
                                            <button
                                                aria-label="Collection actions"
                                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                                className={`p-1 text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors ${isMenuOpen ? 'text-foreground bg-background' : ''}`}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {isMenuOpen && (
                                                <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-xl z-50 min-w-[180px] overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                                    {isEmptying ? (
                                                        <div className="p-2 space-y-2">
                                                            <p className="text-xs font-bold text-red-500 px-1">Delete all prompts?</p>
                                                            <p className="text-[10px] text-muted-foreground px-1 leading-tight">This will permanently delete {collection.totalPrompts || collection._count?.prompts || 0} prompts in this collection.</p>
                                                            <div className="flex gap-2 pt-1">
                                                                <button onClick={handleEmpty} className="flex-1 text-xs bg-red-500 text-white py-1.5 rounded hover:bg-red-600 font-medium">Confirm</button>
                                                                <button onClick={() => setIsEmptying(false)} className="flex-1 text-xs bg-muted text-foreground py-1.5 rounded hover:bg-background">Cancel</button>
                                                            </div>
                                                        </div>
                                                    ) : isDeleting ? (
                                                        <div className="p-2 space-y-2">
                                                            <p className="text-xs font-bold text-red-500 px-1">Delete collection?</p>
                                                            <div className="space-y-1">
                                                                <button onClick={() => handleDelete(false)} className="w-full text-left text-[11px] hover:bg-red-50 text-red-600 p-1.5 rounded border border-red-100 dark:border-red-900/30 dark:hover:bg-red-900/20">
                                                                    <strong>Delete Collection Only</strong>
                                                                    <div className="text-[9px] opacity-80">Prompts move to parent</div>
                                                                </button>
                                                                <button onClick={() => handleDelete(true)} className="w-full text-left text-[11px] bg-red-500 text-white p-1.5 rounded hover:bg-red-600">
                                                                    <strong>Delete Everything</strong>
                                                                    <div className="text-[9px] opacity-90">Delete collection & prompts</div>
                                                                </button>
                                                            </div>
                                                            <button onClick={() => setIsDeleting(false)} className="w-full text-xs bg-muted text-foreground py-1 rounded hover:bg-background mt-1">Cancel</button>
                                                        </div>
                                                    ) : (
                                                        <div className="p-1">
                                                            <button
                                                                onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground/80 hover:bg-background hover:text-primary rounded-md transition-colors text-left"
                                                            >
                                                                <Edit2 size={14} /> Edit Details
                                                            </button>
                                                            <button
                                                                onClick={toggleSelectionMode}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground/80 hover:bg-background hover:text-primary rounded-md transition-colors text-left"
                                                            >
                                                                <Layers size={14} /> Change multiple...
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    import("@/lib/export-client").then(({ exportCollection }) => {
                                                                        exportCollection(collection.id, collection.title);
                                                                    });
                                                                    setIsMenuOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground/80 hover:bg-background hover:text-primary rounded-md transition-colors text-left"
                                                            >
                                                                <FileText size={14} /> Export Collection
                                                            </button>
                                                            {isOwner && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setIsEmptying(true)}
                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground/80 hover:bg-background hover:text-red-500 rounded-md transition-colors text-left"
                                                                    >
                                                                        <Trash2 size={14} /> Empty Collection
                                                                    </button>
                                                                    <div className="h-px bg-border my-1" />
                                                                    <button
                                                                        onClick={() => setIsDeleting(true)}
                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors text-left"
                                                                    >
                                                                        <Trash2 size={14} /> Delete Collection
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    {error && (
                        <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                    {collection.id !== 'unassigned' && !isSelectionMode && !isGuest && (
                        <div className="flex gap-2">
                            <Link href={`/prompts/new?collectionId=${collection.id}`} className="btn btn-sm btn-primary flex-1 justify-center">
                                <Plus size={14} /> New Prompt
                            </Link>
                            <Link href={`/collections/new?parentId=${collection.id}`} className="btn btn-sm bg-surface border border-border hover:bg-background px-2" title="New Sub-collection">
                                <Folder size={14} /> <Plus size={10} className="-ml-1" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Lists Section */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-w-[300px]">
                    {collection.children.length > 0 && !isSelectionMode && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Sub-collections</h3>
                            <div className="space-y-1">
                                {collection.children.map((child: any) => (
                                    <SubCollectionDropTarget key={child.id} collection={child} onError={setError} />
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                            {isSelectionMode ? (
                                <div className="flex items-center justify-between w-full bg-primary/10 p-2 rounded-md border border-primary/20 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-primary text-xs flex flex-col leading-none">
                                            <span>{selectedPromptIds.size}</span>
                                            <span className="text-[9px] font-normal uppercase opacity-70">Selected</span>
                                        </div>
                                        <div className="h-6 w-px bg-primary/20 mx-1"></div>
                                        <button
                                            onClick={handleSelectAll}
                                            className="p-1 hover:bg-primary/20 rounded text-foreground/80 hover:text-primary transition-colors"
                                            title="Select All"
                                        >
                                            <CheckSquare size={14} />
                                        </button>
                                        <button
                                            onClick={handleDeselectAll}
                                            disabled={selectedPromptIds.size === 0}
                                            className="p-1 hover:bg-primary/20 rounded text-foreground/80 hover:text-primary disabled:opacity-50 transition-colors"
                                            title="Deselect All"
                                        >
                                            <Square size={14} />
                                        </button>
                                        <div className="h-6 w-px bg-primary/20 mx-1"></div>
                                        <button
                                            onClick={() => setIsTagModalOpen(true)}
                                            disabled={selectedPromptIds.size === 0}
                                            className="text-xs flex items-center gap-1 text-foreground/80 hover:text-primary disabled:opacity-50 transition-colors"
                                            title="Add Tags"
                                        >
                                            <TagIcon size={14} /> Add Tags
                                        </button>
                                        <span className="text-muted-foreground text-xs mx-1">|</span>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1" title="Drag selected items to a collection on the left">
                                            <Move size={14} /> Drag to move
                                        </div>
                                    </div>
                                    <button onClick={toggleSelectionMode} className="p-1 hover:bg-primary/20 rounded-full text-foreground/70 hover:text-foreground transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prompts</h3>
                                    <SortControls />
                                </>
                            )}
                        </div>
                        {collection.prompts.length > 0 ? (
                            <div className="space-y-1">
                                {collection.prompts.map((prompt: any) => (
                                    <CollectionPromptListItem
                                        key={prompt.id}
                                        prompt={prompt}
                                        isSelected={promptId === prompt.id}
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                togglePromptSelection(prompt.id);
                                            } else {
                                                router.push(`/collections/${collection.id}?promptId=${prompt.id}`);
                                            }
                                        }}
                                        onDragStart={(e: any) => handleBulkDragStart(e, prompt.id)}
                                        isSelectionMode={isSelectionMode}
                                        isChecked={selectedPromptIds.has(prompt.id)}
                                        onToggleSelection={() => togglePromptSelection(prompt.id)}
                                        tagColorsEnabled={tagColorsEnabled}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="px-3 text-sm text-muted-foreground italic">No prompts yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Tag Modal - Placed here or ported to parent? Placed here since state is here. */}
            {isTagModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Add Tags to Selection</h3>
                            <button onClick={() => setIsTagModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Select tags to add to the {selectedPromptIds.size} selected prompts.
                        </p>

                        <BulkTagSelector
                            initialTags={tags}
                            onSave={async (tagIds) => {
                                await bulkAddTags(Array.from(selectedPromptIds), tagIds);
                                setIsTagModalOpen(false);
                                setIsSelectionMode(false);
                                setSelectedPromptIds(new Set());
                            }}
                            onCancel={() => setIsTagModalOpen(false)}
                            tagColorsEnabled={tagColorsEnabled}
                        />
                    </div>
                </div>
            )}
        </>
    );
}


function SubCollectionDropTarget({ collection, onError }: { collection: any, onError: (msg: string) => void }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const { t } = useLanguage(); // Ensure useLanguage is imported if used, but t is maybe not needed if we hardcode or pass it. 
    // Actually CollectionSidebar uses useLanguage? No, it doesn't seem to based on my read. It uses hardcoded "Sub-collections".
    // Let's safe check imports.

    // Let's implement without t() for now to match file style or use what's available.

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
        e.dataTransfer.dropEffect = "move";
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
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
                // Import moveCollection if not imported
                // It is imported at top of file: import { updateCollectionDetails, deleteCollection, emptyCollection } from "@/actions/collections"; 
                // Wait, moveCollection is MISSING from imports in CollectionSidebar.tsx I read earlier?
                // Let's check imports.
                await moveCollection(draggedColId, collection.id);
            } catch (error) {
                console.error("Failed to move collection:", error);
                onError("Failed to move collection.");
            }
        } else if (bulkPromptIds) {
            try {
                const ids = JSON.parse(bulkPromptIds);
                if (Array.isArray(ids) && ids.length > 0) {
                    await bulkMovePrompts(ids, collection.id);
                }
            } catch (error) {
                console.error("Failed to bulk move prompts:", error);
                onError("Failed to bulk move prompts.");
            }
        } else if (draggedPromptId) {
            try {
                // movePrompt imported?
                await movePrompt(draggedPromptId, collection.id);
            } catch (error) {
                console.error("Failed to move prompt:", error);
                onError("Failed to move prompt.");
            }
        }
    };

    return (
        <Link
            href={`/collections/${collection.id}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors border border-transparent ${isDragOver ? "bg-primary/10 border-primary text-primary" : "hover:bg-background text-foreground"
                }`}
        >
            <Folder size={16} className={isDragOver ? "text-primary" : "text-primary/70"} />
            <span className="truncate flex-1 font-medium">{collection.title}</span>
            <span className="text-xs text-muted-foreground">({collection.totalPrompts !== undefined ? collection.totalPrompts : (collection._count?.prompts || 0)})</span>
        </Link>
    );
}

function BulkTagSelector({ initialTags, onSave, onCancel, tagColorsEnabled }: { initialTags: any[], onSave: (ids: string[]) => void, onCancel: () => void, tagColorsEnabled?: boolean }) {
    return (
        <form action={async (formData) => {
            const tags = formData.getAll("tagIds") as string[];
            onSave(tags);
        }}>
            <div className="mb-4">
                <TagSelector initialTags={initialTags} tagColorsEnabled={tagColorsEnabled} />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="btn bg-muted text-foreground">Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Tags</button>
            </div>
        </form>
    )
}
