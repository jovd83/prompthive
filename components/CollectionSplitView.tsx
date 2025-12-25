"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Folder, Plus, ArrowLeft, ChevronRight, FileText, MoreVertical, Edit2, Trash2, Check, X, Copy, Tag as TagIcon, Layers, Move } from "lucide-react";
import SortControls from "@/components/SortControls";
import PromptDetail from "@/components/PromptDetail";
import PromptCard from "@/components/PromptCard";
import { updateCollectionName, updateCollectionDetails, deleteCollection, emptyCollection } from "@/actions/collections";
import { bulkAddTags } from "@/actions/prompts";
import { copyToClipboard } from "@/lib/clipboard";
import TagSelector from "@/components/TagSelector";

export default function CollectionSplitView({ collection, selectedPrompt, promptId, currentUserId, collectionPath, isFavorited, tags = [] }: any) {
    const [width, setWidth] = useState(350);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isResizing, setIsResizing] = useState(false);

    // Edit/Delete State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(collection.title);
    const [editDescription, setEditDescription] = useState(collection.description || "");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEmptying, setIsEmptying] = useState(false);

    // Bulk Action State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const menuRef = useRef<HTMLDivElement>(null);

    // Check for URL actions (e.g. from context menu)
    useEffect(() => {
        if (searchParams.get("action") === "edit") {
            setIsEditing(true);
            // Clean up the param so refresh doesn't re-trigger or it doesn't stick
            // But router.replace might be too aggressive if we want to keep other params.
            // For now, leaving it is fine as long as closing edit mode doesn't break.
            // Actually, if we close edit mode, the param remains.
            // It's better to clear it when entering edit mode or when closing.
        }
    }, [searchParams]);

    const isOwner = collection.ownerId === currentUserId;

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsDeleting(false); // Reset delete intent
                setIsEmptying(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync edit name if collection changes
    useEffect(() => {
        setEditName(collection.title);
        setEditDescription(collection.description || "");
    }, [collection.title, collection.description]);

    // Error State
    const [error, setError] = useState<string | null>(null);

    // Clear error on transition
    useEffect(() => {
        setError(null);
    }, [collection.id, promptId]);

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
            // Redirect happens via router now to pass the message
            router.replace(`/?deletedCollection=${encodeURIComponent(collection.title)}`);
            router.refresh(); // Ensure server state is fresh
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

    // Bulk selection handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedPromptIds(new Set()); // Clear selection when toggling
        setIsMenuOpen(false);
    };

    const togglePromptSelection = (id: string) => {
        const newSet = new Set(selectedPromptIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedPromptIds(newSet);
    };

    const handleBulkDragStart = (e: React.DragEvent, promptId: string) => {
        // If dragging one of the selected items, drag all selected
        if (selectedPromptIds.has(promptId)) {
            // Include array of IDs
            e.dataTransfer.setData("bulkPromptIds", JSON.stringify(Array.from(selectedPromptIds)));
            // Visual feedback could be handled by custom drag image, but browser default is okay for now
            e.dataTransfer.setData("text/plain", `${selectedPromptIds.size} prompts`);
        } else {
            // Standard single drag
            e.dataTransfer.setData("promptId", promptId);
        }
    };

    const handleBulkAddTags = async () => {
        // Just used to trigger the modal logic
        // This is now handled by the TagSelector wrapper in the modal
    };

    // ... Resizing logic ...
    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const resizeWithMovement = (e: MouseEvent) => {
        if (isResizing) {
            setWidth(prev => {
                const newW = prev + e.movementX;
                if (newW < 200) return 200;
                if (newW > 800) return 800;
                return newW;
            });
        }
    };

    useEffect(() => {
        if (isResizing) {
            window.addEventListener("mousemove", resizeWithMovement);
            window.addEventListener("mouseup", stopResizing);
        } else {
            window.removeEventListener("mousemove", resizeWithMovement);
            window.removeEventListener("mouseup", stopResizing);
        }
        return () => {
            window.removeEventListener("mousemove", resizeWithMovement);
            window.removeEventListener("mouseup", stopResizing);
        };
    }, [isResizing]);

    return (
        <div className="flex h-[calc(100vh-4rem)] -m-6 relative">
            {/* List Column */}
            <div
                className="border-r border-border flex flex-col bg-surface relative shrink-0"
                style={{ width: isCollapsed ? "0px" : `${width}px`, transition: isResizing ? "none" : "width 0.3s ease", overflow: "hidden" }}
            >
                <div className="p-4 border-b border-border min-w-[300px]">
                    <div className="mb-4">
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
                            {/* Current parent for immediate back context if needed, or just rely on breadcrumbs */}
                        </div>

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

                                    {collection.id !== 'unassigned' && (
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
                    {collection.id !== 'unassigned' && !isSelectionMode && (
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

                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-w-[300px]">
                    {collection.children.length > 0 && !isSelectionMode && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">Sub-collections</h3>
                            <div className="space-y-1">
                                {collection.children.map((child: any) => (
                                    <Link
                                        key={child.id}
                                        href={`/collections/${child.id}`}
                                        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-background text-sm transition-colors"
                                    >
                                        <Folder size={16} className="text-primary/70" />
                                        <span className="truncate flex-1">{child.title}</span>
                                        <span className="text-xs text-muted-foreground">({child.totalPrompts !== undefined ? child.totalPrompts : (child._count?.prompts || 0)})</span>
                                    </Link>
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
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="px-3 text-sm text-muted-foreground italic">No prompts yet.</p>
                        )}
                    </div>
                </div>

                {/* Drag Handle */}
                <div
                    className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-primary/50 transition-colors z-50"
                    onMouseDown={startResizing}
                />
            </div>

            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-4 left-0 z-10 bg-surface border border-border p-1 rounded-r-md shadow-sm hover:bg-background text-muted-foreground"
                style={{ left: isCollapsed ? "0" : `${width}px`, transition: isResizing ? "none" : "left 0.3s ease" }}
                title={isCollapsed ? "Expand List" : "Collapse List"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronRight className="rotate-180" size={14} />}
            </button>

            {/* Detail Column */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-background p-6">
                {selectedPrompt ? (
                    <PromptDetail prompt={selectedPrompt} isFavorited={isFavorited} collectionPaths={collectionPath ? [collectionPath] : undefined} />
                ) : collection.prompts.length > 0 ? (
                    <div className="h-full overflow-y-auto">
                        <div className="mb-6">
                            <div className="flex flex-col gap-2 mb-6">
                                <h2 className="text-2xl font-bold">{collection.title}</h2>
                                {collection.description && <p className="text-muted-foreground">{collection.description}</p>}
                            </div>
                            <div className="grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4">
                                {collection.prompts.map((prompt: any) => (
                                    <PromptCard key={prompt.id} prompt={prompt} isFavorited={false} />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <FileText size={32} className="opacity-50" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Select a prompt</h2>
                        <p className="max-w-md text-center">
                            Choose a prompt from the list on the left to view its details, or create a new one to get started.
                        </p>
                        {collection.description && (
                            <div className="mt-8 p-4 bg-muted/30 rounded-lg max-w-lg text-center">
                                <h3 className="font-bold text-sm mb-1">About this collection</h3>
                                <p className="text-sm">{collection.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bulk Tag Modal */}
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
                        />
                    </div>
                </div>
            )}
        </div >
    );
}

function BulkTagSelector({ initialTags, onSave, onCancel }: { initialTags: any[], onSave: (ids: string[]) => void, onCancel: () => void }) {
    // Custom wrapper around TagSelector or just a simple implementation using it?
    // TagSelector is uncontrolled for selectedTags prop usage usually, but it exposes creates.
    // The existing TagSelector doesn't easily expose "onChange" without modifying it.
    // I need access to the selected tags.
    // Let's create a simplified version or assume we can hack it by using a form submission wrapper?
    // No, cleaner to build a small stateful wrapper here.

    // Actually, TagSelector as implemented in components/TagSelector.tsx uses internal state and hidden inputs.
    // I can't easily extract the state unless I modify TagSelector to accept onChange.
    // Let's modify TagSelector to optional accept `onChange`.
    // Or I can just copy the logic since I have the code.
    // To avoid code duplication, I should update TagSelector. But for now I'll use a form submission approach?
    // No, onSave needs to be async call.

    // I'll simulate a form submission by wrapping it.

    const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

    // HACK: TagSelector doesn't have onChange. 
    // I'll create a new component `MultiTagSelect` quickly or just modify TagSelector later.
    // For now, let's just implement a simple tag picker here to be safe and fast.

    return (
        <form action={async (formData) => {
            const tags = formData.getAll("tagIds") as string[];
            onSave(tags);
        }}>
            <div className="mb-4">
                <TagSelector initialTags={initialTags} />
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="btn bg-muted text-foreground">Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Tags</button>
            </div>
        </form>
    )
}

function CollectionPromptListItem({ prompt, isSelected, onClick, onDragStart, isSelectionMode, isChecked, onToggleSelection }: any) {
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
                {prompt.tags && prompt.tags.map((tag: any) => (
                    <Link key={tag.id} href={`/?tags=${tag.id}`} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" onClick={(e) => e.stopPropagation()}>
                        #{tag.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
