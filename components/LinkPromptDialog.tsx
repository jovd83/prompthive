"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Link as LinkIcon, Loader2 } from "lucide-react";
import { searchCandidatePrompts, linkPrompts } from "@/actions/prompts";
import { useLanguage } from "./LanguageProvider";
import { useRouter } from "next/navigation";

type LinkPromptDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    currentPromptId: string;
    onLinkSuccess?: () => void;
};

type Candidate = {
    id: string;
    title: string;
    technicalId: string | null;
    isLocked: boolean;
    createdBy: { username: string } | null;
};

export default function LinkPromptDialog({ isOpen, onClose, currentPromptId, onLinkSuccess }: LinkPromptDialogProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [query, setQuery] = useState("");
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [linkingId, setLinkingId] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Search effect with debounce
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(async () => {
            if (query.trim().length === 0) {
                setCandidates([]);
                return;
            }
            setLoading(true);
            try {
                const results = await searchCandidatePrompts(query, currentPromptId);
                setCandidates(results as Candidate[]);
            } catch (error) {
                console.error("Link search failed", error);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, isOpen, currentPromptId]);

    const handleLink = async (targetId: string) => {
        setLinkingId(targetId);
        try {
            await linkPrompts(currentPromptId, targetId);
            router.refresh();
            if (onLinkSuccess) onLinkSuccess();
            onClose();
            // Reset
            setQuery("");
            setCandidates([]);
        } catch (error) {
            console.error("Failed to link prompts", error);
            alert("Failed to link prompts");
        } finally {
            setLinkingId(null);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <LinkIcon size={20} className="text-primary" />
                        {t('detail.actions.linkPrompt') || "Link Related Prompt"}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-border bg-muted/20">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="input w-full pl-9"
                            placeholder={t('detail.placeholders.searchPrompts') || "Search prompts..."}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-muted-foreground" size={24} />
                        </div>
                    ) : candidates.length > 0 ? (
                        <div className="space-y-2">
                            {candidates.map((candidate) => (
                                <div key={candidate.id} className="flex justify-between items-center p-3 rounded border border-border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <div className="font-medium truncate">{candidate.title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {candidate.technicalId && <span className="mr-2 font-mono bg-muted px-1 rounded">{candidate.technicalId}</span>}
                                            {candidate.createdBy?.username}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleLink(candidate.id)}
                                        disabled={linkingId === candidate.id}
                                        className="btn btn-sm btn-primary shrink-0"
                                    >
                                        {linkingId === candidate.id ? <Loader2 className="animate-spin" size={14} /> : "Link"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : query.length > 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t('prompts.noResults') || "No prompts found."}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t('advancedSearch.placeholder') || "Start typing to search..."}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-muted/10 flex justify-end">
                    <button onClick={onClose} className="btn bg-background border border-border hover:bg-muted">
                        {t('common.cancel')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
