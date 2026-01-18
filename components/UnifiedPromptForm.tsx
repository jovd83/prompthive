"use client";

import Link from "next/link";
import { Plus, Trash, Upload, Code2 } from "lucide-react";
import CollapsibleSection from "@/components/CollapsibleSection";
import TagSelector from "@/components/TagSelector";
import CodeEditor from "./CodeEditor";
import ExpandableTextarea from "./ExpandableTextarea";
import { useLanguage } from "./LanguageProvider";
import { CollectionWithPrompts, TagWithCount, PromptWithRelations } from "@/types/prisma";
import { usePromptEditor, Variable, UsePromptEditorProps } from "@/hooks/usePromptEditor";

// Helper for collection counts
import { computeRecursiveCounts } from '@/lib/collection-utils';
import { getDisplayName } from "@/lib/prompt-utils";

interface UnifiedPromptFormProps {
    // Mode
    mode: 'CREATE' | 'EDIT';
    // Data
    initialValues?: Partial<PromptWithRelations> & {
        content?: string;
        shortContent?: string;
        usageExample?: string;
        resultText?: string;
        changelog?: string;
        variableDefinitions?: string; // JSON
    };
    collections?: CollectionWithPrompts[];
    tags?: TagWithCount[];
    // Config
    tagColorsEnabled?: boolean;
    privatePromptsEnabled?: boolean;
    // Handlers
    onSubmit: (formData: FormData) => void;
    isPending: boolean;
    serverError?: string | null;
    // For Cancel Link
    cancelHref?: string;
}

export default function UnifiedPromptForm({
    mode,
    initialValues = {},
    collections = [],
    tags = [],
    tagColorsEnabled = true,
    privatePromptsEnabled = false,
    onSubmit,
    isPending,
    serverError,
    cancelHref = "/"
}: UnifiedPromptFormProps) {
    const { t } = useLanguage();

    // Prepare hook props
    const hookProps: UsePromptEditorProps = {
        initialVariables: initialValues.variableDefinitions ? JSON.parse(initialValues.variableDefinitions) : [],
        initialContent: initialValues.versions?.[0]?.content || initialValues.content || "",
        initialShortContent: initialValues.versions?.[0]?.shortContent || initialValues.shortContent || "",
        initialDescription: initialValues.description || "",
        // Attachments
        existingAttachments: mode === 'EDIT' ? (initialValues.versions?.[0]?.attachments as any) : [],
        legacyResultImage: mode === 'EDIT' ? (initialValues.versions?.[0]?.resultImage) : null
    };

    const {
        // Content
        content, setContent,
        shortContent, setShortContent,
        description, setDescription,
        variables,
        // Actions
        addVariable, removeVariable, updateVariable, scanForVariables,
        // UI
        isCodeView, setIsCodeView,
        isLongCodeView, setIsLongCodeView,
        // Files
        newAttachments, newResultImages,
        handleFileChange, removeNewAttachment, removeNewResultImage,
        // Existing Files
        keptAttachments, keptResultImages,
        removeKeptAttachment, removeKeptResultImage
    } = usePromptEditor(hookProps);



    // Dropdown options
    const collectionsWithCounts = Array.from(computeRecursiveCounts(collections as any).values());

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        // Manually append controlled state
        formData.set("description", description);
        formData.set("content", content);
        formData.set("shortContent", shortContent);
        formData.set("variableDefinitions", JSON.stringify(variables));

        // Append Files
        newResultImages.forEach((file) => formData.append("resultImages", file));
        newAttachments.forEach((file) => formData.append("attachments", file));

        // Append Kept Files (Edit Mode)
        if (mode === 'EDIT') {
            keptAttachments.forEach(att => formData.append("keepAttachmentIds", att.id));
            keptResultImages.forEach(att => {
                if (!att.isLegacy) formData.append("keepResultImageIds", att.id);
                else formData.append("existingResultImagePath", att.filePath);
            });
        }

        onSubmit(formData);
    };

    const submitLabel = isPending
        ? (mode === 'CREATE' ? t('form.buttons.creating') : t('form.buttons.saving'))
        : (mode === 'CREATE' ? t('form.buttons.createPrompt') : t('form.buttons.saveNewVersion'));

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {serverError && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    {serverError}
                </div>
            )}

            {/* Hidden Fields */}
            {mode === 'EDIT' && initialValues.id && <input type="hidden" name="promptId" value={initialValues.id} />}

            {/* --- Basic Info / Metadata --- */}
            <div className="card space-y-4">
                <h2 className="text-xl font-bold">{mode === 'CREATE' ? t('form.sections.basicInfo') : t('form.sections.metadata')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label htmlFor="title" className="block text-sm font-medium mb-1">{t('form.labels.title')}</label>
                        <input id="title" name="title" type="text" className="input" required defaultValue={initialValues.title || ""} placeholder={t('form.placeholders.title')} data-lpignore="true" />
                    </div>

                    <div>
                        <label htmlFor="collectionId" className="block text-sm font-medium mb-1">{t('form.labels.collection')}</label>
                        <select id="collectionId" name="collectionId" className="input" defaultValue={initialValues.collections?.[0]?.id || ""}>
                            <option value="">{t('form.labels.none')}</option>
                            {collectionsWithCounts.map((col: any) => (
                                <option key={col.id} value={col.id}>{col.title} ({col.totalPrompts})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.tags')}</label>
                        <TagSelector
                            initialTags={tags}
                            tagColorsEnabled={tagColorsEnabled}
                            initialSelectedTags={initialValues.tags as any || []}
                            selectedTagIds={initialValues.tags?.map(t => t.id) || []}
                        />
                    </div>
                    {/* Private Prompt Checkbox */}
                    {privatePromptsEnabled && (
                        <div className="flex items-center gap-2 mt-6">
                            <input
                                type="checkbox"
                                name="isPrivate"
                                id="isPrivate"
                                className="checkbox"
                                defaultChecked={(initialValues as any).isPrivate}
                            />
                            <label htmlFor="isPrivate" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                                {t('form.labels.privatePrompt') || "Private Prompt"}
                                <span className="text-muted-foreground text-xs font-normal">
                                    ({t('form.hints.privatePrompt') || "Only visible to you"})
                                </span>
                            </label>
                        </div>
                    )}
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
                </div>
            </div>

            {/* --- Version Info (Edit Only) --- */}
            {mode === 'EDIT' && (
                <div className="card space-y-4">
                    <h2 className="text-xl font-bold">{t('form.sections.versionInfo').replace('{{v}}', ((initialValues.versions?.[0]?.versionNumber || 0) + 1).toString())}</h2>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.changelog')}</label>
                        <textarea name="changelog" className="input h-20 resize-y" placeholder={t('form.placeholders.changelog')} required />
                    </div>
                </div>
            )}

            {/* --- Content --- */}
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
                            placeholder={t('form.placeholders.content')}
                            minHeight="160px"
                        />
                    ) : (
                        <ExpandableTextarea
                            name="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="input h-40 font-mono text-sm resize-y"
                            required
                            placeholder={t('form.placeholders.content')}
                            label={t('form.sections.promptContent')}
                        />
                    )}
                </div>
            </div>

            {/* --- Short Prompt --- */}
            <CollapsibleSection
                title={t('form.sections.shortPrompt')}
                defaultOpen={!!shortContent}
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
                <div>
                    {isLongCodeView ? (
                        <CodeEditor
                            value={shortContent}
                            onChange={setShortContent}
                            name="shortContent"
                            placeholder={t('form.placeholders.shortContent')}
                            minHeight="160px"
                        />
                    ) : (
                        <ExpandableTextarea
                            name="shortContent"
                            value={shortContent}
                            onChange={(e) => setShortContent(e.target.value)}
                            className="input h-40 font-mono text-sm resize-y"
                            placeholder={t('form.placeholders.shortContent')}
                            label={t('form.sections.shortPrompt')}
                        />
                    )}
                </div>
            </CollapsibleSection>

            {/* --- Usage Example --- */}
            <CollapsibleSection title={t('form.sections.usageExample')} defaultOpen={!!initialValues.versions?.[0]?.usageExample}>
                <ExpandableTextarea
                    name="usageExample"
                    className="input h-32 font-mono text-sm resize-y"
                    defaultValue={initialValues.versions?.[0]?.usageExample || ""}
                    placeholder={t('form.placeholders.usage')}
                    label={t('form.sections.usageExample')}
                />
            </CollapsibleSection>

            {/* --- Variables --- */}
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
                </div>
            </CollapsibleSection>

            {/* --- Results --- */}
            <CollapsibleSection title={t('form.sections.results')} defaultOpen={mode === 'EDIT' && (!!initialValues.versions?.[0]?.resultText || keptResultImages.length > 0)}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.textualResult')}</label>
                        <textarea
                            name="resultText"
                            className="input h-32 font-mono text-sm resize-y"
                            placeholder={t('form.placeholders.resultText')}
                            defaultValue={initialValues.versions?.[0]?.resultText || ""}
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
                                        {getDisplayName(att)}
                                    </span>
                                    <button type="button" onClick={() => removeKeptResultImage(att.id)} className="text-muted-foreground hover:text-red-500">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            ))}
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
                        <label className="btn bg-surface hover:bg-background border border-border text-sm flex items-center gap-2 cursor-pointer w-fit">
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
            </CollapsibleSection>

            {/* --- Attachments --- */}
            <CollapsibleSection title={t('form.sections.attachments')}>
                <div className="space-y-4">
                    <label className="block text-sm font-medium mb-1">{t('form.labels.uploadFiles')}</label>
                    <div className="space-y-2 mb-2">
                        {/* Kept Attachments */}
                        {keptAttachments.map((att: any) => (
                            <div key={att.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-secondary/10">
                                <span className="text-sm truncate max-w-[80%] flex items-center gap-2">
                                    <span className="text-muted-foreground text-xs">{t('form.labels.keep')}</span>
                                    {getDisplayName(att)}
                                </span>
                                <button type="button" onClick={() => removeKeptAttachment(att.id)} className="text-muted-foreground hover:text-red-500">
                                    <Trash size={14} />
                                </button>
                            </div>
                        ))}
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
                    <label className="btn bg-surface hover:bg-background border border-border text-sm flex items-center gap-2 cursor-pointer w-fit">
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
            </CollapsibleSection>

            {/* --- Source --- */}
            <CollapsibleSection title={t('form.sections.source')} defaultOpen={mode === 'EDIT' && !!initialValues.resource}>
                <label className="block text-sm font-medium mb-1">{t('form.labels.resource')}</label>
                <input name="resource" type="text" className="input" defaultValue={initialValues.resource || ""} placeholder={t('form.placeholders.resource')} data-lpignore="true" />
            </CollapsibleSection>

            {/* --- Footer --- */}
            <div className="flex justify-end gap-4 pt-4">
                {cancelHref && (
                    <Link
                        href={cancelHref}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground hover:underline px-4 transition-colors"
                    >
                        {t('common.cancel')}
                    </Link>
                )}
                <button type="submit" disabled={isPending} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary/20">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
