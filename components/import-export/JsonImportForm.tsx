"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "../LanguageProvider";
import { useRouter } from "next/navigation";
import { importBatchAction, importStructureAction } from "@/actions/import-batch";
import { Loader2, AlertCircle, Check } from "lucide-react";

export default function JsonImportForm() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success?: boolean, count?: number, skipped?: number, error?: string } | null>(null);
    const [progress, setProgress] = useState<{ current: number, total: number, message?: string } | null>(null);
    const { t } = useLanguage();
    const router = useRouter();

    const BATCH_SIZE = 20;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setResult(null);
        setProgress(null);

        const formData = new FormData(e.currentTarget);
        const file = formData.get("file") as File;
        if (!file) return;

        startTransition(async () => {
            try {
                const text = await file.text();
                let cleanText = text.trim();
                if (cleanText.charCodeAt(0) === 0xFEFF) cleanText = cleanText.slice(1);

                let data;
                try {
                    data = JSON.parse(cleanText);
                } catch (e: any) {
                    try {
                        const fixedText = cleanText.replace(/}(\s*){/g, "},$1{");
                        data = JSON.parse(fixedText);
                    } catch (repairError) {
                        setResult({ success: false, error: `Invalid JSON format: ${e.message}` });
                        return;
                    }
                }

                let items: any[] = [];
                let collectionIdMap: Record<string, string> | undefined = undefined;

                setProgress({ current: 0, total: 0, message: "Analyzing..." });

                // Detect V2
                if (data && !Array.isArray(data) && data.version === 2 && data.definedCollections) {
                    // Import Structure First
                    setProgress({ current: 0, total: 100, message: "Restoring collection structure..." });
                    const structRes = await importStructureAction(data.definedCollections);
                    if (!structRes.success) throw new Error(structRes.error || "Failed to import collections");

                    collectionIdMap = structRes.idMap;
                    items = data.prompts || [];
                } else {
                    items = Array.isArray(data) ? data : (data.prompts || [data]);
                }

                const total = items.length;
                let processed = 0;
                let imported = 0;
                let skipped = 0;

                setProgress({ current: 0, total, message: "Importing prompts..." });

                for (let i = 0; i < total; i += BATCH_SIZE) {
                    const batch = items.slice(i, i + BATCH_SIZE);
                    // Pass the map only if it exists
                    const res = await importBatchAction(batch, collectionIdMap);

                    if (!res.success) throw new Error(res.error || "Batch failed");

                    imported += res.count || 0;
                    skipped += res.skipped || 0;
                    processed += batch.length;
                    setProgress({ current: processed, total, message: "Importing prompts..." });
                }

                setResult({ success: true, count: imported, skipped });
                setProgress(null);
                router.refresh();

            } catch (err: any) {
                setResult({ success: false, error: err.message || "An unexpected error occurred" });
                setProgress(null);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('importExport.selectJson')}</label>
                <input type="file" name="file" accept=".json" required className="input" />
            </div>

            {progress && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress.message || "Importing..."}</span>
                        {progress.total > 0 && <span>{Math.round((progress.current / progress.total) * 100)}%</span>}
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        {progress.current} / {progress.total} prompts processed
                    </p>
                </div>
            )}

            {result?.error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {result.error}
                </div>
            )}

            {result?.success && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <Check size={16} /> {t('importExport.importComplete').replace('{{count}}', String(result.count || 0)).replace('{{skipped}}', String(result.skipped || 0))}
                </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={!!progress || isPending}>
                {progress ? <Loader2 size={16} className="animate-spin" /> : t('importExport.importButton')}
            </button>
        </form>
    );
}
