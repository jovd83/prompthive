"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "../LanguageProvider";
import { importLocalFolderAction } from "@/actions/imports";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { computeRecursiveCounts } from "@/lib/collection-utils";

export default function LocalImportForm({ collections }: { collections: any[] }) {
    const [path, setPath] = useState("");
    const [targetCollectionId, setTargetCollectionId] = useState("");
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success?: boolean, count?: number, error?: string } | null>(null);
    const { t } = useLanguage();

    // Compute counts for dropdown logic if needed, or just display raw
    const collectionsWithCounts = Array.from(computeRecursiveCounts(collections).values());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setResult(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append("path", path);
            if (targetCollectionId) {
                formData.append("targetCollectionId", targetCollectionId);
            }

            const res = await importLocalFolderAction(formData);
            setResult(res);
            if (res.success) setPath("");
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('importExport.absFolderPath')}</label>
                <input
                    type="text"
                    name="path"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="e.g. D:\Documents\Prompts or /home/user/prompts"
                    required
                    className="input font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    {t('importExport.absFolderDesc')}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">{t('importExport.targetCollection')}</label>
                <select
                    value={targetCollectionId}
                    onChange={(e) => setTargetCollectionId(e.target.value)}
                    className="input"
                >
                    <option value="">{t('importExport.rootCollection')}</option>
                    {collectionsWithCounts.map((col: any) => (
                        <option key={col.id} value={col.id}>{col.title} ({col.totalPrompts})</option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                    {t('importExport.targetCollectionDesc')}
                </p>
            </div>

            {result?.error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {result.error}
                </div>
            )}

            {result?.success && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <Check size={16} /> {t('importExport.successImport').replace('{{count}}', String(result.count))}
                </div>
            )}

            <button type="submit" className="btn btn-primary bg-green-600 hover:bg-green-700 text-white border-green-600" disabled={isPending}>
                {isPending ? (
                    <>
                        <Loader2 size={16} className="animate-spin" /> {t('importExport.importing')}
                    </>
                ) : (
                    t('importExport.startLocalImport')
                )}
            </button>
        </form>
    );
}
