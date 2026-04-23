"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Trash, Upload, DownloadCloud, Loader2, Sparkles, BrainCircuit } from "lucide-react";
import TagSelector from "@/components/TagSelector";
import CollapsibleSection from "@/components/CollapsibleSection";
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
    agentSkills?: any[];
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
    agentSkills = [],
    tagColorsEnabled = true,
    onSubmit,
    isPending,
    serverError,
    cancelHref = "/"
}: UnifiedSkillFormProps) {
    const { t } = useLanguage();
    const [isFetchingInfo, startFetching] = useTransition();

    const [repoUrl, setRepoUrl] = useState(initialValues.repoUrl || "");
    const [url, setUrl] = useState(initialValues.url || "");
    const [title, setTitle] = useState(initialValues.title || "");
    const [description, setDescription] = useState(initialValues.description || "");
    const [installCommand, setInstallCommand] = useState(initialValues.installCommand || "");
    const [agentUsage, setAgentUsage] = useState(initialValues.agentUsage || "");
    const [agentSkillIds, setAgentSkillIds] = useState<string[]>(() => {
        try {
            return JSON.parse(initialValues.agentSkillIds || "[]");
        } catch (e) {
            return [];
        }
    });

    const toggleAgentSkill = (id: string) => {
        setAgentSkillIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

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
                    if (data.repoUrl && !url) setUrl(data.repoUrl); // Use repoUrl as default url value if empty
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
        formData.set("url", url);
        formData.set("installCommand", installCommand);
        formData.set("agentUsage", agentUsage);
        formData.set("agentSkillIds", JSON.stringify(agentSkillIds));

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
                        <label htmlFor="repoUrl" className="block text-sm font-medium mb-1">{t('skills.url') || "URL"}</label>
                        <input 
                            id="repoUrl" 
                            name="repoUrl" 
                            type="url" 
                            className="input" 
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/username/repository" 
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
                        <label htmlFor="url" className="block text-sm font-medium mb-1">{t('skills.url') || "URL"}</label>
                        <input 
                            id="url" 
                            name="url" 
                            type="url" 
                            className="input" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..." 
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

            {/* Use of Agents */}
            <CollapsibleSection 
                title={t('form.useOfAgents')} 
                secondaryTitle="Optional instructions for specialized agents"
                icon={<Sparkles size={18} className="text-amber-500" />}
                defaultOpen={!!agentUsage}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {t('form.skillAgentUsageHint')}
                    </p>
                    <ExpandableTextarea
                        name="agentUsage"
                        value={agentUsage}
                        onChange={(e) => setAgentUsage(e.target.value)}
                        className="input h-32 font-mono text-sm resize-y bg-background"
                        placeholder="e.g., Use an Architect agent to plan the file structure..."
                        label={t('form.useOfAgents')}
                    />
                </div>
            </CollapsibleSection>

            {/* Use of Agent Skills */}
            <CollapsibleSection 
                title={t('form.useOfAgentSkills')} 
                secondaryTitle="Linked dependencies on other agent skills"
                icon={<BrainCircuit size={18} className="text-blue-500" />}
                defaultOpen={agentSkillIds.length > 0}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Select which other Agent Skills this skill depends on or should make use of for its execution.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto p-1 custom-scrollbar">
                        {agentSkills.map((skill: any) => (
                            <label 
                                key={skill.id} 
                                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:bg-surface/80 group ${agentSkillIds.includes(skill.id) ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20' : 'border-border bg-background'}`}
                            >
                                <div className="pt-0.5">
                                    <input 
                                        type="checkbox" 
                                        className="checkbox checkbox-primary border-2" 
                                        checked={agentSkillIds.includes(skill.id)}
                                        onChange={() => toggleAgentSkill(skill.id)}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate group-hover:text-primary transition-colors">{skill.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1" title={skill.versions?.[0]?.content || skill.description}>
                                        {skill.description || skill.versions?.[0]?.content || "No description provided"}
                                    </div>
                                    {skill.repoUrl && (
                                        <div className="text-[10px] text-muted-foreground/60 mt-2 truncate flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-border" /> {skill.repoUrl.replace('https://github.com/', '')}
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                        {agentSkills.length === 0 && (
                            <div className="col-span-full py-8 text-center bg-muted/30 rounded-xl border-2 border-dashed border-border/50">
                                <p className="text-sm text-muted-foreground italic">No agent skills available to link.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CollapsibleSection>

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
