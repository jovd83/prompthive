"use client";

import { History, RotateCcw, GitCompare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, nl, fr } from "date-fns/locale";
import { useLanguage } from "@/components/LanguageProvider";
import { PromptWithRelations } from "@/types/prisma";

const localeMap: Record<string, any> = { en: enUS, nl: nl, fr: fr };

interface PromptVersionHistoryProps {
    prompt: PromptWithRelations;
    selectedVersionId: string;
    selectedVersionNumber: number;
    onSelectVersion: (id: string) => void;
    onRestore: (id: string) => void;
    onCompare: (version: any) => void; // Using any for version partially to avoid strict conflict, can upgrade later
}

export default function PromptVersionHistory({
    prompt,
    selectedVersionId,
    selectedVersionNumber,
    onSelectVersion,
    onRestore,
    onCompare
}: PromptVersionHistoryProps) {
    const { t, language } = useLanguage();

    return (
        <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
                <History size={18} /> {t('detail.labels.history')}
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {prompt.versions.map((v) => (
                    <div
                        key={v.id}
                        className={`w-full p-2 rounded-md text-sm flex justify-between items-center transition-colors group border ${selectedVersionId === v.id ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-background border-transparent"
                            }`}
                    >
                        <button
                            onClick={() => onSelectVersion(v.id)}
                            className="flex-1 text-left flex justify-between items-center"
                        >
                            <div className="flex flex-col">
                                <span className="font-medium">{t('detail.meta.version')} {v.versionNumber}</span>
                                <span className="text-xs text-muted-foreground">{t('detail.meta.by')} {v.createdBy?.username || t('detail.meta.unknown')}</span>
                            </div>
                            <span className="text-xs text-muted-foreground mr-2">{formatDistanceToNow(new Date(v.createdAt), { addSuffix: false, locale: localeMap[language] || enUS })}</span>
                        </button>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRestore(v.id);
                                }}
                                className="p-1.5 hover:text-primary hover:bg-primary/10 rounded transition-all text-muted-foreground"
                                title={t('detail.actions.restore') || "Restore this version"}
                            >
                                <RotateCcw size={14} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCompare(v);
                                }}
                                className={`p-1.5 hover:text-primary hover:bg-primary/10 rounded transition-all ${selectedVersionId === v.id ? 'text-primary/50' : 'text-muted-foreground'}`}
                                title={t('detail.actions.compare').replace('{{v1}}', v.versionNumber.toString()).replace('{{v2}}', selectedVersionNumber.toString())}
                            >
                                <GitCompare size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
