"use client";

import { useState, useEffect, useCallback } from "react";

// ConfirmationDialog uses a custom portal implementation. I should stick to that pattern or use a standard modal if available.
// Let's replicate the ConfirmationDialog pattern but for this specific modal to avoid dependency guessing.

import { createPortal } from "react-dom";
import { X, Search, Link as LinkIcon, Loader2 } from "lucide-react";
import { searchCandidatePrompts, linkPrompts } from "@/actions/prompts";
import { useLanguage } from "./LanguageProvider";

type LinkPromptModalProps = {
    isOpen: boolean;
    onClose: () => void;
    sourcePromptId: string;
};

type Candidate = {
    id: string;
    title: string;
    technicalId: string | null;
};

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function LinkPromptModal({ isOpen, onClose, sourcePromptId }: LinkPromptModalProps) {
    const { t } = useLanguage(); // access translation
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [linkingId, setLinkingId] = useState<string | null>(null);

    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Effect for search
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        let active = true;
        setLoading(true);
        searchCandidatePrompts(debouncedQuery, sourcePromptId)
            .then(data => {
                if (active) setResults(data as unknown as Candidate[]);
            })
            .catch(console.error)
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [debouncedQuery, sourcePromptId]);

    const handleLink = async (targetId: string) => {
        setLinkingId(targetId);
        try {
            await linkPrompts(sourcePromptId, targetId);
            onClose();
        } catch (error) {
            console.error("Failed to link:", error);
            // Optionally show error
        } finally {
            setLinkingId(null);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <LinkIcon size={20} />
                        {t('detail.actions.linkPrompt')}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            className="input w-full pl-9"
                            placeholder={t('detail.placeholders.searchPrompts')}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="min-h-[200px] max-h-[300px] overflow-y-auto custom-scrollbar border border-border rounded-md bg-background/50">
                        {loading ? (
                            <div className="flex justify-center items-center h-32 text-muted-foreground">
                                <Loader2 className="animate-spin mr-2" /> Searching...
                            </div>
                        ) : results.length > 0 ? (
                            <div className="divide-y divide-border">
                                {results.map(p => (
                                    <div key={p.id} className="p-3 flex justify-between items-center hover:bg-muted/50 transition-colors">
                                        <div>
                                            <div className="font-medium text-sm">{p.title}</div>
                                            {p.technicalId && (
                                                <div className="text-xs text-muted-foreground font-mono">{p.technicalId}</div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleLink(p.id)}
                                            disabled={linkingId === p.id}
                                            className="btn btn-sm btn-primary"
                                        >
                                            {linkingId === p.id ? <Loader2 className="animate-spin" size={14} /> : "Link"}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="flex justify-center items-center h-32 text-muted-foreground text-sm">
                                No prompts found.
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-32 text-muted-foreground text-sm">
                                Type at least 2 characters to search.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
