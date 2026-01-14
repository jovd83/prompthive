"use client";

import { importPrompts } from "@/actions/imports";
import { scrapeUrlForPrompts } from "@/actions/scraper";
import { ScrapedPrompt } from "@/types/scraper";
import { Upload, Download, Globe, Folder, Share } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Collection } from "@prisma/client";
import { useLanguage } from "./LanguageProvider";

import JsonImportForm from "./import-export/JsonImportForm";
import LocalImportForm from "./import-export/LocalImportForm";
import StandardExportForm from "./import-export/StandardExportForm";
import ExportZeroForm from "./import-export/ExportZeroForm";

import BackupSettings from "./settings/BackupSettings";
import DangerZoneSettings from "./settings/DangerZoneSettings";
import { Settings } from "@/types/settings";

export default function ImportExportContent({
    collections = [],
    initialSettings,
    isAdmin = false
}: {
    collections?: Collection[],
    initialSettings?: Settings,
    isAdmin?: boolean
}) {
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

            {isAdmin && initialSettings && (
                <div className="space-y-8 pt-8 border-t border-border">
                    <BackupSettings initialSettings={initialSettings} />
                    <DangerZoneSettings />
                </div>
            )}
        </div >
    );
}

