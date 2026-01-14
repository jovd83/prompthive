"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { createTag } from "@/actions/prompts";

import { useLanguage } from "./LanguageProvider";

type Tag = {
    id: string;
    name: string;
    color?: string | null;
};

export default function TagSelector({ initialTags = [], selectedTagIds = [], initialSelectedTags = [], tagColorsEnabled = true }: { initialTags: Tag[], selectedTagIds?: string[], initialSelectedTags?: Tag[], tagColorsEnabled?: boolean }) {
    const { t } = useLanguage();
    // Maintain local list of available tags including newly created ones
    const [availableTags, setAvailableTags] = useState<Tag[]>(initialTags);
    const [selectedTags, setSelectedTags] = useState<Tag[]>(() => {
        if (initialSelectedTags.length > 0) return initialSelectedTags;
        return initialTags.filter(tag => selectedTagIds.includes(tag.id));
    });

    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [wrapperRef, setWrapperRef] = useState<HTMLDivElement | null>(null);

    // Filter tags based on query and exclude already selected ones
    const filteredTags = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(query.toLowerCase()) &&
        !selectedTags.some(selected => selected.id === tag.id)
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef && !wrapperRef.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (tagId: string) => {
        const tag = availableTags.find(t => t.id === tagId);
        if (tag) {
            setSelectedTags([...selectedTags, tag]);
            setQuery("");
            setIsOpen(false);
            setActiveIndex(-1);
        }
    };

    const handleRemove = (tagId: string) => {
        setSelectedTags(selectedTags.filter(t => t.id !== tagId));
    };

    const handleCreate = async () => {
        if (!query.trim()) return;

        try {
            const newTag = await createTag(query.trim());
            setAvailableTags([...availableTags, newTag]);
            setSelectedTags([...selectedTags, newTag]);
            setQuery("");
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to create tag:", error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredTags.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredTags.length) {
                handleSelect(filteredTags[activeIndex].id);
            } else if (query.trim() && filteredTags.length === 0) {
                handleCreate();
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    return (
        <div className="space-y-2" ref={setWrapperRef}>
            {/* Hidden inputs for form submission */}
            {selectedTags.map(tag => (
                <input key={tag.id} type="hidden" name="tagIds" value={tag.id} />
            ))}

            {/* Selected Tags Display */}
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map(tag => {
                    const style = tagColorsEnabled && tag.color ? {
                        backgroundColor: `${tag.color}20`, // 20% opacity (hex)
                        color: tag.color,
                        borderColor: `${tag.color}40`,
                    } : undefined;

                    return (
                        <span key={tag.id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${!style ? "bg-primary/10 text-primary border-primary/20" : ""}`}
                            style={style}
                        >
                            {tag.name}
                            <button
                                type="button"
                                onClick={() => handleRemove(tag.id)}
                                className="ml-1.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center hover:bg-black/10 focus:outline-none"
                            >
                                <X size={10} />
                            </button>
                        </span>
                    );
                })}
            </div>

            <div className="relative">
                <input
                    type="text"
                    className="input w-full"
                    placeholder={t('tags.placeholder') || "Search or create tags..."}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setActiveIndex(-1);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />

                {isOpen && (query || filteredTags.length > 0) && (
                    <div role="listbox" className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-md shadow-md max-h-60 overflow-auto">
                        {filteredTags.length > 0 ? (
                            filteredTags.map((tag, index) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${index === activeIndex
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-accent hover:text-accent-foreground text-foreground"
                                        }`}
                                    onClick={() => handleSelect(tag.id)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <span>{tag.name}</span>
                                    {selectedTags.some(t => t.id === tag.id) && <Check size={14} />}
                                </button>
                            ))
                        ) : (
                            query.trim() && (
                                <button
                                    type="button"
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-primary bg-accent/20"
                                    onClick={handleCreate}
                                >
                                    {(t('tags.create') || 'Create "{{tag}}"').replace('{{tag}}', query)}
                                </button>
                            )
                        )}
                        {filteredTags.length === 0 && !query.trim() && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">{t('tags.noMatch') || "No tags found"}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

