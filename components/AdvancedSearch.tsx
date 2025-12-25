"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter, X } from "lucide-react";
import { useLanguage } from "./LanguageProvider";


export default function AdvancedSearch({ basePath = "/", testId }: { basePath?: string, testId?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useLanguage();

    const [search, setSearch] = useState(searchParams.get("q") || "");
    const [tags, setTags] = useState(searchParams.get("tags") || "");
    const [creator, setCreator] = useState(searchParams.get("creator") || "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set("q", search); else params.delete("q");
        if (tags) params.set("tags", tags); else params.delete("tags");
        if (creator) params.set("creator", creator); else params.delete("creator");

        // When searching, we might want to keep the current sort order if possible, 
        // but typically a new search resets things or just appends.
        // We ensure we push to the correct basePath.
        router.push(`${basePath}?${params.toString()}`);
    };

    const clearFilters = () => {
        setSearch("");
        setTags("");
        setCreator("");
        router.push(basePath);
    };

    return (
        <div className="w-full">
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                        placeholder={t('advancedSearch.placeholder')}
                        className="input pl-10"
                        data-testid={testId}
                    />
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle filters"
                    className={`btn border transition-colors ${isOpen ? "bg-primary text-primary-foreground" : "bg-surface border-border hover:bg-background"}`}
                >
                    <Filter size={18} />
                </button>
            </div>

            {isOpen && (
                <form onSubmit={handleSearch} className="card p-4 space-y-4 animate-fade-in mt-2 absolute z-10 w-full max-w-lg shadow-lg">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('advancedSearch.tags')}</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="input"
                                placeholder="coding, writing, seo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">{t('advancedSearch.creator')}</label>
                            <input
                                type="text"
                                value={creator}
                                onChange={(e) => setCreator(e.target.value)}
                                className="input"
                                placeholder="admin@example.com"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={clearFilters} className="btn bg-surface border border-border hover:bg-background">
                            <X size={16} /> {t('advancedSearch.clear')}
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {t('advancedSearch.apply')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
