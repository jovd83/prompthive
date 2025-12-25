"use client";

import { importPrompts, importLocalFolderAction } from "@/actions/imports";
import { scrapeUrlForPrompts } from "@/actions/scraper";
import { ScrapedPrompt } from "@/types/scraper";
import { Upload, Download, AlertCircle, Globe, Loader2, CheckSquare, Square, Folder, Check } from "lucide-react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { computeRecursiveCounts } from "@/lib/collection-utils";
import { Collection } from "@prisma/client";
import { useLanguage } from "./LanguageProvider";

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
                <a href="/api/export" target="_blank" className="btn btn-primary">
                    {t('importExport.downloadJson')}
                </a>
            </div>

            <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Upload size={24} /> {t('importExport.importStandard')}
                </h2>
                <p className="text-muted-foreground mb-4">
                    {t('importExport.importUnifiedDesc') || t('importExport.importStandardDesc')}
                </p>

                <form action={importPrompts} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('importExport.selectJson')}</label>
                        <input type="file" name="file" accept=".json" required className="input" />
                    </div>
                    <button type="submit" className="btn btn-primary">
                        {t('importExport.importButton')}
                    </button>
                </form>
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
        </div>
    );
}


