"use client";

import Link from "next/link";

import { useState, useTransition } from "react";
import { createVersion } from "@/actions/prompts";
import CollapsibleSection from "@/components/CollapsibleSection";
import { Plus, Trash, Upload, Code2 } from "lucide-react";
import TagSelector from "@/components/TagSelector";
import CodeEditor from "./CodeEditor";
import { computeRecursiveCounts } from '@/lib/collection-utils';
import { usePromptEditor } from "@/hooks/usePromptEditor";
import { useLanguage } from "./LanguageProvider";
import ExpandableTextarea from "./ExpandableTextarea";

export default function EditPromptForm({ prompt, latestVersion, collections = [], tags = [] }: any) {
    const { t } = useLanguage();
    const {
        variables,
        addVariable,
        removeVariable,
        updateVariable,
        scanForVariables,
        newAttachments,
        newResultImages,
        handleFileChange,
        removeNewAttachment,
        removeNewResultImage
    } = usePromptEditor(latestVersion.variableDefinitions ? JSON.parse(latestVersion.variableDefinitions) : []);

    // Compute collection counts for dropdown
    const collectionsWithCounts = Array.from(computeRecursiveCounts(collections).values());

    // State for prompt content
    const [content, setContent] = useState(latestVersion.content || "");
    const [shortContent, setShortContent] = useState(latestVersion.shortContent || "");
    const [description, setDescription] = useState(prompt.description || "");

    // Toggle states for code view
    const [isCodeView, setIsCodeView] = useState(false);
    const [isLongCodeView, setIsLongCodeView] = useState(false);

    // State for attachments and result images
    // Initialize kept attachments: split by role
    const allExistingAttachments = latestVersion.attachments || [];

    // Kept standard attachments
    const [keptAttachments, setKeptAttachments] = useState<any[]>(
        allExistingAttachments.filter((a: any) => a.role !== 'RESULT')
    );

    // Kept result images (plus legacy handling)
    const initialKeptResults = allExistingAttachments.filter((a: any) => a.role === 'RESULT');
    // If legacy resultImage exists and is NOT in the attachments list (by path check), add it as a pseudo-attachment
    if (latestVersion.resultImage && !initialKeptResults.some((a: any) => a.filePath === latestVersion.resultImage)) {
        initialKeptResults.push({
            id: 'legacy-result-image',
            filePath: latestVersion.resultImage,
            role: 'RESULT',
            isLegacy: true
        });
    }
    const [keptResultImages, setKeptResultImages] = useState<any[]>(initialKeptResults);

    const removeKeptAttachment = (id: string) => {
        setKeptAttachments(prev => prev.filter(att => att.id !== id));
    };

    const removeKeptResultImage = (id: string) => {
        setKeptResultImages(prev => prev.filter(att => att.id !== id));
    };

    const [isPending, startTransition] = useTransition();

    // Error State
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);

        // Handle Result Images (Legacy + Multi)
        const legacyResult = keptResultImages.find(att => att.isLegacy);
        if (legacyResult) {
            formData.append("existingResultImagePath", legacyResult.filePath);
        }

        // Append Kept Result IDs (exclude legacy)
        keptResultImages.forEach(att => {
            if (!att.isLegacy) {
                formData.append("keepResultImageIds", att.id);
            }
        });

        // Append New Result Images
        newResultImages.forEach(file => {
            formData.append("resultImages", file);
        });

        // Append Kept IDs
        keptAttachments.forEach(att => {
            formData.append("keepAttachmentIds", att.id);
        });

        // Append New Attachments
        newAttachments.forEach(file => {
            formData.append("attachments", file);
        });

        startTransition(async () => {
            try {
                await createVersion(formData);
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT") {
                    throw error;
                }
                console.error("Submission failed:", error);
                setError(error.message || "Failed to create version. Please try again.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    {error === "Failed to create version. Please try again." ? t('form.errors.createVersionFailed') : error}
                </div>
            )}
            <input type="hidden" name="promptId" value={prompt.id} />

            <div className="card space-y-4">
                <h2 className="text-xl font-bold">{t('form.sections.metadata')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">{t('form.labels.title')}</label>
                        <input name="title" type="text" className="input" required defaultValue={prompt.title} data-lpignore="true" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.collection')}</label>
                        <select name="collectionId" className="input" defaultValue={prompt.collections?.[0]?.id || "unassigned"}>
                            <option value="unassigned">{t('form.labels.noCollection')}</option>
                            {collectionsWithCounts.map((col: any) => (
                                <option key={col.id} value={col.id}>{col.title} ({col.totalPrompts})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.tags')}</label>
                        <TagSelector initialTags={tags || []} selectedTagIds={prompt.tags?.map((t: any) => t.id) || []} initialSelectedTags={prompt.tags || []} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">{t('form.labels.description')}</label>
                        <ExpandableTextarea
                            name="description"
                            className="input h-20 resize-y"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            data-lpignore="true"
                            label={t('form.labels.description')}
                        />
                    </div>
                </div>
            </div>

            <div className="card space-y-4">
                <h2 className="text-xl font-bold">{t('form.sections.versionInfo').replace('{{v}}', ((latestVersion.versionNumber || 0) + 1).toString())}</h2>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('form.labels.changelog')}</label>
                    <textarea name="changelog" className="input h-20 resize-y" placeholder={t('form.placeholders.changelog')} required />
                </div>
            </div>

            <div className="card space-y-4 relative">
                <div className="flex justify-between items-center mb-1">
                    <h2 className="text-xl font-bold">{t('form.sections.promptContent')}</h2>
                    <button
                        type="button"
                        onClick={() => setIsCodeView(!isCodeView)}
                        className={`text-xs flex items-center gap-1 border border-border px-2 py-1 rounded hover:bg-surface transition-colors ${isCodeView ? 'text-primary border-primary bg-primary/5' : 'text-muted-foreground'}`}
                        title="Toggle Markdown Highlight"
                    >
                        <Code2 size={14} /> {t('form.buttons.codeView')}
                    </button>
                </div>
                <div>
                    {isCodeView ? (
                        <CodeEditor
                            value={content}
                            onChange={setContent}
                            name="content"
                            minHeight="160px"
                        />
                    ) : (
                        <ExpandableTextarea
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input h-40 font-mono text-sm resize-y"
                            required
                            label={t('form.sections.promptContent')}
                        />
                    )}
                </div>
            </div>

            <CollapsibleSection
                title={t('form.sections.shortPrompt')}
                defaultOpen={!!latestVersion.shortContent}
                action={
                    <button
                        type="button"
                        onClick={() => setIsLongCodeView(!isLongCodeView)}
                        className={`text-xs flex items-center gap-1 border border-border px-2 py-1.5 rounded hover:bg-surface transition-colors ${isLongCodeView ? 'text-primary border-primary bg-primary/5' : 'text-muted-foreground'}`}
                    >
                        <Code2 size={14} /> {t('form.buttons.codeView')}
                    </button>
                }
            >
                <div className="relative">
                    {isLongCodeView ? (
                        <CodeEditor
                            value={shortContent}
                            onChange={setShortContent}
                            name="shortContent"
                            minHeight="160px"
                        />
                    ) : (
                        <ExpandableTextarea
                            name="shortContent"
                            value={shortContent}
                            onChange={(e) => setShortContent(e.target.value)}
                            className="input h-40 font-mono text-sm resize-y"
                            label={t('form.sections.shortPrompt')}
                        />
                    )}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('form.sections.usageExample')} defaultOpen={!!latestVersion.usageExample}>
                <ExpandableTextarea
                    name="usageExample"
                    className="input h-32 font-mono text-sm resize-y"
                    defaultValue={latestVersion.usageExample || ""}
                    label={t('form.sections.usageExample')}
                />
            </CollapsibleSection>

            <CollapsibleSection title={t('form.sections.variables')} defaultOpen={true}>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: t('form.hints.variables') }}></p>
                    {variables.map((v, i) => (
                        <div key={i} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={v.key}
                                onChange={(e) => updateVariable(i, "key", e.target.value)}
                                className="input !w-[40ch]"
                                placeholder={t('form.labels.variableName')}
                            />
                            <textarea
                                value={v.description}
                                onChange={(e) => updateVariable(i, "description", e.target.value)}
                                className="input flex-1 min-h-[5rem] py-2 resize-y"
                                placeholder={t('form.labels.variableDesc')}
                                rows={3}
                            />
                            <button type="button" onClick={() => removeVariable(i)} className="btn bg-red-50 text-red-500 hover:bg-red-100 p-2 border border-red-100">
                                <Trash size={16} />
                            </button>
                        </div>
                    ))}
                    <div className="flex gap-2">
                        <button type="button" onClick={addVariable} className="btn bg-surface hover:bg-background border border-border text-sm flex-1">
                            <Plus size={14} /> {t('form.buttons.addVariable')}
                        </button>
                        <button type="button" onClick={() => scanForVariables(content, shortContent)} className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 text-sm flex-1">
                            {t('form.buttons.autoAddVariables')}
                        </button>
                    </div>
                    <input type="hidden" name="variableDefinitions" value={JSON.stringify(variables)} />
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('form.sections.results')} defaultOpen={!!latestVersion.resultText || keptResultImages.length > 0}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.textualResult')}</label>
                        <textarea
                            name="resultText"
                            className="input h-32 font-mono text-sm resize-y"
                            placeholder={t('form.placeholders.resultText')}
                            defaultValue={latestVersion.resultText || ""}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.resultFiles')}</label>
                        <div className="space-y-2 mb-2">
                            {/* Kept Results */}
                            {keptResultImages.map((att: any) => (
                                <div key={att.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-amber-500/10 border-amber-500/20">
                                    <span className="text-sm truncate max-w-[80%] flex items-center gap-2">
                                        <span className="text-amber-600 font-bold text-xs uppercase">{t('form.labels.keep')}{att.isLegacy ? ` ${t('form.labels.legacy')}` : ''}</span>
                                        {att.filePath.split('/').pop()}
                                    </span>
                                    <button type="button" onClick={() => removeKeptResultImage(att.id)} className="text-muted-foreground hover:text-red-500">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            ))}

                            {/* New Results */}
                            {newResultImages.map((file, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-primary/5">
                                    <span className="text-sm truncate max-w-[80%] flex items-center gap-2">
                                        <span className="text-primary text-xs font-bold">{t('form.labels.new')}</span>
                                        {file.name}
                                    </span>
                                    <button type="button" onClick={() => removeNewResultImage(i)} className="text-muted-foreground hover:text-red-500">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <label className="btn bg-surface hover:bg-background border border-border text-sm flex items-center gap-2 cursor-pointer">
                                <Upload size={14} /> {t('form.buttons.addResultFile')}
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept=".txt, .md, .doc, .docx, .xls, .xlsx, .pdf, .jpg, .jpeg, .png, .svg, .gif, .json, .j2, .xml, .xsd, .swagger, .jinja2"
                                    onChange={(e) => handleFileChange(e, 'RESULT')}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('form.sections.attachments')}>
                <div className="space-y-4">
                    <label className="block text-sm font-medium mb-1">{t('form.labels.manageFiles')}</label>
                    <div className="space-y-2">
                        {/* Kept Attachments */}
                        {keptAttachments.map((att: any) => (
                            <div key={att.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-secondary/10">
                                <span className="text-sm truncate max-w-[80%] flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">{t('form.labels.keep')}</span>
                                    {att.filePath.split('/').pop()}
                                </span>
                                <button type="button" onClick={() => removeKeptAttachment(att.id)} className="text-muted-foreground hover:text-red-500">
                                    <Trash size={14} />
                                </button>
                            </div>
                        ))}

                        {/* New Attachments */}
                        {newAttachments.map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-primary/5">
                                <span className="text-sm truncate max-w-[80%] flex items-center gap-2">
                                    <span className="text-primary text-xs font-bold">{t('form.labels.new')}</span>
                                    {file.name}
                                </span>
                                <button type="button" onClick={() => removeNewAttachment(i)} className="text-muted-foreground hover:text-red-500">
                                    <Trash size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <label className="btn bg-surface hover:bg-background border border-border text-sm flex items-center gap-2 cursor-pointer">
                            <Upload size={14} /> {t('form.buttons.addAttachment')}
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                accept=".txt, .md, .doc, .docx, .xls, .xlsx, .pdf, .jpg, .jpeg, .png, .svg, .gif, .json, .j2, .xml, .xsd, .swagger, .jinja2"
                                onChange={(e) => handleFileChange(e, 'ATTACHMENT')}
                            />
                        </label>
                    </div>
                </div>
            </CollapsibleSection>

            <CollapsibleSection title={t('form.sections.source')} defaultOpen={!!prompt.resource}>
                <label className="block text-sm font-medium mb-1">{t('form.labels.resource')}</label>
                <input name="resource" type="text" className="input" defaultValue={prompt.resource || ""} placeholder={t('form.placeholders.resource')} data-lpignore="true" />
            </CollapsibleSection>

            <div className="flex justify-end gap-4 pt-4">
                <Link
                    href={`/prompts/${prompt.id}`}
                    className="flex items-center justify-center text-muted-foreground hover:text-foreground hover:underline px-4 transition-colors"
                >
                    {t('common.cancel')}
                </Link>
                <button type="submit" disabled={isPending} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary/20">
                    {isPending ? t('form.buttons.saving') : t('form.buttons.saveNewVersion')}
                </button>
            </div>
        </form >
    );
}
