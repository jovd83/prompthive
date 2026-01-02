"use client";

import { importPrompts, importLocalFolderAction } from "@/actions/imports";
import { scrapeUrlForPrompts } from "@/actions/scraper";
import { ScrapedPrompt } from "@/types/scraper";
import { Upload, Download, AlertCircle, Globe, Loader2, CheckSquare, Square, Folder, Check, Share } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { computeRecursiveCounts } from "@/lib/collection-utils";
import { Collection } from "@prisma/client";
import { useLanguage } from "./LanguageProvider";

import { useRouter } from "next/navigation";
import CollectionTree from "./CollectionTree";
import { useSession } from "next-auth/react";

import { importBatchAction, importStructureAction } from "@/actions/import-batch";

function JsonImportForm() {
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

function LocalImportForm({ collections }: { collections: any[] }) {
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



import { getExportMeta, getExportBatch } from "@/actions/export";

function StandardExportForm({ collections }: { collections: any[] }) {
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
            a.download = `prompthive-backup-${new Date().toISOString().split('T')[0]}.json`;
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

function ExportZeroForm({ collections }: { collections: any[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
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
        if (selectedIds.size === 0) return;
        setIsExporting(true);
        try {
            const res = await fetch('/api/export-zero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionIds: Array.from(selectedIds) })
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompthive-zero-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert("Failed to export");
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

            {/* Tree View */}
            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-muted/20">
                <CollectionTree
                    collections={collections}
                    mode="selection"
                    variant="default" // No EyeOff icons
                    checkedIds={selectedIds}
                    onToggle={toggleSelection}
                />
            </div>

            <button
                onClick={handleExport}
                disabled={selectedIds.size === 0 || isExporting}
                className="btn btn-primary w-full"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : t('importExport.exportZeroButton')}
            </button>
        </div>
    );
}

export default function ImportExportContent({ collections = [] }: { collections?: Collection[] }) {
    const [scrapeUrl, setScrapeUrl] = useState("");
    const [scrapedPrompts, setScrapedPrompts] = useState<ScrapedPrompt[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isScraping, setIsScraping] = useState(false);
    const [scrapeError, setScrapeError] = useState("");
    const [importSuccess, setImportSuccess] = useState("");
    const { t } = useLanguage();

    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!scrapeUrl) return;

        setIsScraping(true);
        setScrapeError("");
        setScrapedPrompts([]);
        setSelectedIndices(new Set());
        setImportSuccess("");

        try {
            const results = await scrapeUrlForPrompts(scrapeUrl);
            if (results.length === 0) {
                setScrapeError(t('prompts.noResults'));
            } else {
                setScrapedPrompts(results);
                // Select all by default
                setSelectedIndices(new Set(results.map((_, i) => i)));
            }
        } catch (err: any) {
            setScrapeError(err.message || "Failed to scrape URL");
        } finally {
            setIsScraping(false);
        }
    };

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setSelectedIndices(newSet);
    };

    const handleImportSelected = async () => {
        const promptsToImport = scrapedPrompts.filter((_, i) => selectedIndices.has(i));
        if (promptsToImport.length === 0) return;

        try {
            const jsonString = JSON.stringify(promptsToImport);
            const blob = new Blob([jsonString], { type: "application/json" });
            const file = new File([blob], "scraped_prompts.json", { type: "application/json" });

            const formData = new FormData();
            formData.append("file", file);

            await importPrompts(formData);
            setImportSuccess(t('prompts.importedCount').replace('{{count}}', String(promptsToImport.length)));
            setScrapedPrompts([]); // Clear results
            setScrapeUrl("");
        } catch (e: any) {
            setScrapeError("Import failed: " + e.message);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <h1 className="text-3xl font-bold mb-6">{t('importExport.title')}</h1>

            <div className="card border-blue-500/20 bg-blue-500/5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Globe size={24} /> {t('importExport.aiScraperGuide')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.aiScraperDesc')}
                </p>
                <div className="flex gap-4 items-center">
                    <Link href="/help#ai-scraping" className="btn btn-outline border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {t('importExport.viewGuide')}
                    </Link>
                </div>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Download size={24} /> {t('importExport.exportPrompts')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.exportDesc')}
                </p>

                <StandardExportForm collections={collections} />
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Share size={24} /> {t('importExport.exportZeroTitle')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.exportZeroDesc')}
                </p>
                <ExportZeroForm collections={collections} />
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Upload size={24} /> {t('importExport.importStandard')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.importUnifiedDesc') || t('importExport.importStandardDesc')}
                </p>

                <JsonImportForm />
            </div>



            {/* Local Folder Import */}
            <div className="card border-green-500/20 bg-green-500/5">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Folder size={24} /> {t('importExport.importLocal')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.importLocalDesc')}
                </p>

                <LocalImportForm collections={collections} />
            </div>
        </div >
    );
}


