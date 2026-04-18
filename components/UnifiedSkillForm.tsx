"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Trash, Upload, DownloadCloud, Loader2 } from "lucide-react";
import TagSelector from "@/components/TagSelector";
import ExpandableTextarea from "./ExpandableTextarea";
import { useLanguage } from "./LanguageProvider";
import { CollectionWithPrompts, TagWithCount } from "@/types/prisma";

// Helper for collection counts
import { CollectionWithCount, computeRecursiveCounts } from '@/lib/collection-utils';

interface UnifiedSkillFormProps {
    mode: 'CREATE' | 'EDIT';
    initialValues?: any;
    collections?: CollectionWithPrompts[];
    tags?: TagWithCount[];
    tagColorsEnabled?: boolean;
    onSubmit: (formData: FormData) => void;
    isPending: boolean;
    serverError?: string | null;
    cancelHref?: string;
}

export default function UnifiedSkillForm({
    mode,
    initialValues = {},
    collections = [],
    tags = [],
    tagColorsEnabled = true,
    onSubmit,
    isPending,
    serverError,
    cancelHref = "/"
}: UnifiedSkillFormProps) {
    const { t } = useLanguage();
    const [isFetchingInfo, startFetching] = useTransition();

    const [repoUrl, setRepoUrl] = useState(initialValues.repoUrl || "");
    const [title, setTitle] = useState(initialValues.title || "");
    const [description, setDescription] = useState(initialValues.description || "");
    const [installCommand, setInstallCommand] = useState(initialValues.installCommand || "");

    const collectionsWithCounts = Array.from(computeRecursiveCounts(collections as unknown as CollectionWithCount[]).values());

    const handleFetchInfo = async () => {
        if (!repoUrl) return;

        startFetching(async () => {
            try {
                const res = await fetch("/api/skills/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ repoUrl })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.title && !title) setTitle(data.title);
                    if (data.description && !description) setDescription(data.description);
                    if (data.installCommand && !installCommand) setInstallCommand(data.installCommand);
                } else {
                    const data = await res.json();
                    console.error("Failed to fetch repo info:", data.error);
                }
            } catch (err) {
                console.error("Failed to fetch repo info:", err);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        formData.set("title", title);
        formData.set("description", description);
        formData.set("repoUrl", repoUrl);
        formData.set("installCommand", installCommand);

        onSubmit(formData);
    };

    const submitLabel = isPending
        ? (mode === 'CREATE' ? t('form.buttons.creating') : t('form.buttons.saving'))
        : (mode === 'CREATE' ? t('skills.create') || "Create Skill" : t('skills.saveChanges') || "Save Skill");

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {serverError && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    {serverError}
                </div>
            )}

            {mode === 'EDIT' && initialValues.id && <input type="hidden" name="skillId" value={initialValues.id} />}

            {/* Import Repository Info */}
            <div className="card space-y-4 border-blue-500/20 bg-blue-500/5">
                <h2 className="text-xl font-bold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <DownloadCloud size={20} /> Import Repository
                </h2>
                <div className="flex flex-col md:flex-row gap-2 items-end">
                    <div className="flex-1 w-full">
                        <label htmlFor="repoUrl" className="block text-sm font-medium mb-1">{t('skills.repositoryUrl') || "GitHub Repository URL"}</label>
                        <input 
                            id="repoUrl" 
                            name="repoUrl" 
                            type="url" 
                            className="input" 
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository" 
                            required
                        />
                    </div>
                    <button 
                        type="button" 
                        onClick={handleFetchInfo}
                        disabled={isFetchingInfo || !repoUrl}
                        className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isFetchingInfo ? <Loader2 size={16} className="animate-spin" /> : (t('skills.fetchInfo') || "Fetch Info")}
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="card space-y-4">
                <h2 className="text-xl font-bold">{t('form.sections.basicInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium mb-1">{t('form.labels.title')}</label>
                        <input 
                            id="title" 
                            name="title" 
                            type="text" 
                            className="input" 
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('form.placeholders.title')} 
                        />
                    </div>
                    
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">{t('form.labels.description')}</label>
                        <ExpandableTextarea
                            name="description"
                            className="input h-20 resize-y"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('form.placeholders.description')}
                            data-lpignore="true"
                            label={t('form.labels.description')}
                        />
                    </div>

                    <div className="col-span-2">
                        <label htmlFor="installCommand" className="block text-sm font-medium mb-1">{t('skills.installCommand') || "Install Command"}</label>
                        <input 
                            id="installCommand" 
                            name="installCommand" 
                            type="text" 
                            className="input font-mono bg-muted/50" 
                            required 
                            value={installCommand}
                            onChange={(e) => setInstallCommand(e.target.value)}
                            placeholder="npx -y skill-name@latest ./" 
                        />
                    </div>

                    <div>
                        <label htmlFor="collectionId" className="block text-sm font-medium mb-1">{t('form.labels.collection')}</label>
                        <select id="collectionId" name="collectionId" className="input" defaultValue={initialValues.collectionId || initialValues.collections?.[0]?.id || ""}>
                            <option value="">{t('form.labels.none')}</option>
                            {collectionsWithCounts.map((col) => (
                                <option key={col.id} value={col.id}>{col.title}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.tags')}</label>
                        <TagSelector
                            initialTags={tags}
                            tagColorsEnabled={tagColorsEnabled}
                            initialSelectedTags={initialValues.tags || []}
                            selectedTagIds={initialValues.tags?.map((t: any) => t.id) || []}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
                {cancelHref && (
                    <Link
                        href={cancelHref}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground hover:underline px-4 transition-colors"
                    >
                        {t('common.cancel')}
                    </Link>
                )}
                <button type="submit" disabled={isPending} className="btn bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 text-lg shadow-lg shadow-blue-500/20">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
