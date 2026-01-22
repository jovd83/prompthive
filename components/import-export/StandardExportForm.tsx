"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import { getExportMeta, getExportBatch } from "@/actions/export";
import CollectionTree from "../CollectionTree";
import { Loader2, Check } from "lucide-react";

export default function StandardExportForm({ collections }: { collections: any[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(collections.map(c => c.id)));
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
    const [result, setResult] = useState<{ count?: number } | null>(null);
    const { t } = useLanguage();

    const handleSelectAll = () => {
        setSelectedIds(new Set(collections.map(c => c.id)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(null);
        setResult(null);

        try {
            // 1. Get Meta (IDs + Hierarchy)
            const meta = await getExportMeta(Array.from(selectedIds));
            if (!meta.success || !meta.promptIds) throw new Error(meta.error || "Failed to start export");

            const total = meta.totalPrompts || 0;
            const promptIds = meta.promptIds;
            const definedCollections = meta.definedCollections || [];

            let allPrompts: any[] = [];
            let processed = 0;

            setProgress({ current: 0, total });

            // 2. Batch Fetch
            const BATCH_SIZE = 20;
            for (let i = 0; i < total; i += BATCH_SIZE) {
                const batchIds = promptIds.slice(i, i + BATCH_SIZE);
                const batchRes = await getExportBatch(batchIds);

                if (!batchRes.success || !batchRes.prompts) throw new Error(batchRes.error || "Batch export failed");

                allPrompts = allPrompts.concat(batchRes.prompts);
                processed += batchIds.length;
                setProgress({ current: processed, total });
            }

            // 3. Assemble V2 JSON
            const exportObject = {
                version: 2,
                exportedAt: new Date().toISOString(),
                prompts: allPrompts,
                definedCollections: definedCollections
            };

            // 4. Download
            const jsonString = JSON.stringify(exportObject, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `myprompthive-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setResult({ count: total });
            setProgress(null);

        } catch (error) {
            console.error(error);
            alert("Failed to export");
            setProgress(null);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 mb-2">
                <button type="button" onClick={handleSelectAll} className="text-xs btn btn-ghost h-8 px-2">
                    {t('common.selectAll') || "Select All"}
                </button>
                <button type="button" onClick={handleDeselectAll} className="text-xs btn btn-ghost h-8 px-2">
                    {t('common.deselectAll') || "Deselect All"}
                </button>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-muted/20">
                <CollectionTree
                    collections={collections}
                    mode="selection"
                    variant="default"
                    checkedIds={selectedIds}
                    onToggle={toggleSelection}
                />
            </div>

            {progress && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Exporting...</span>
                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                        {progress.current} / {progress.total} prompts exported
                    </p>
                </div>
            )}

            {result && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <Check size={16} /> {t('importExport.exportComplete').replace('{{count}}', String(result.count))}
                </div>
            )}

            <button
                onClick={handleExport}
                disabled={isExporting}
                className="btn btn-primary w-full"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : t('importExport.downloadJson')}
            </button>
        </div>
    );
}
