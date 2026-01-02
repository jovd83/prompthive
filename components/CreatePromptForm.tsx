"use client";

import { useState, useTransition } from "react";
import { createPrompt } from "@/actions/prompts";
import CollapsibleSection from "@/components/CollapsibleSection";
import TagSelector from "@/components/TagSelector";
import { Plus, Trash, Upload, Code2 } from "lucide-react";
import CodeEditor from "./CodeEditor"; // Import the new CodeEditor component
import ExpandableTextarea from "./ExpandableTextarea";
import { Collection, Tag } from "@prisma/client";
import { computeRecursiveCounts } from '@/lib/collection-utils';
import { usePromptEditor } from "@/hooks/usePromptEditor";
import { extractUniqueVariables } from '@/lib/prompt-utils';

// ... (Tag and Collection types remain the same)

import { useLanguage } from "./LanguageProvider";

// ... (imports)

export default function CreatePromptForm({
    collections,
    tags,
    initialCollectionId
}: {
    collections: (Collection & { _count?: { prompts: number } })[],
    tags: Tag[],
    initialCollectionId?: string
}) {
    const { t } = useLanguage();

    // ... hooks and state
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [content, setContent] = useState("");
    const [shortContent, setShortContent] = useState("");
    const [variables, setVariables] = useState<{ key: string, description: string }[]>([]);
    const [isCodeView, setIsCodeView] = useState(false);
    const [isLongCodeView, setIsLongCodeView] = useState(false);
    const [newResultImages, setNewResultImages] = useState<File[]>([]);
    const [newAttachments, setNewAttachments] = useState<File[]>([]);

    const collectionsWithCounts = computeRecursiveCounts(
        collections.map(c => ({
            ...c,
            _count: c._count || { prompts: 0 },
            parentId: c.parentId || null
        }))
    );

    // ... helper functions
    const updateVariable = (index: number, key: string, value: string) => {
        const newVars = [...variables];
        newVars[index] = { ...newVars[index], [key]: value };
        setVariables(newVars);
    };

    const removeVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const addVariable = () => {
        setVariables([...variables, { key: "", description: "" }]);
    };

    const scanForVariables = (c: string, lc: string) => {
        const found = extractUniqueVariables(c + " " + lc);

        const newVars = [...variables];
        found.forEach(v => {
            if (!newVars.some(existing => existing.key === v)) {
                newVars.push({ key: v, description: "" });
            }
        });
        setVariables(newVars);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'RESULT' | 'ATTACHMENT') => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // Optional: validate extension here if needed
            if (type === 'RESULT') setNewResultImages([...newResultImages, ...files]);
            else setNewAttachments([...newAttachments, ...files]);
        }
    };

    const removeNewResultImage = (index: number) => {
        setNewResultImages(newResultImages.filter((_, i) => i !== index));
    };

    const removeNewAttachment = (index: number) => {
        setNewAttachments(newAttachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const formData = new FormData(e.currentTarget);

        // Append manually controlled state
        formData.set("content", content); // CodeEditor controlled
        formData.set("shortContent", shortContent); // CodeEditor controlled
        formData.set("variableDefinitions", JSON.stringify(variables));

        // Append files
        newResultImages.forEach((file) => formData.append("resultImages", file));
        newAttachments.forEach((file) => formData.append("attachments", file));

        startTransition(async () => {
            try {
                await createPrompt(formData);
            } catch (err: any) {
                if (err.message === 'NEXT_REDIRECT' || err.message?.includes('NEXT_REDIRECT') || err.digest?.includes('NEXT_REDIRECT')) {
                    throw err;
                }
                console.error("CreatePrompt Error:", err);
                setError(err.message || "An unexpected error occurred.");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    {/* Only internationalize generic errors, unless error comes from server with specific code */}
                    {error === "Failed to create prompt. Please try again." ? t('form.errors.createFailed') : error}
                </div>
            )}
            <div className="card space-y-4">
                <h2 className="text-xl font-bold">{t('form.sections.basicInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">{t('form.labels.title')}</label>
                        <input name="title" type="text" className="input" required placeholder={t('form.placeholders.title')} data-lpignore="true" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.collection')}</label>
                        <select name="collectionId" className="input" defaultValue={initialCollectionId || ""}>
                            <option value="">{t('form.labels.none')}</option>
                            {Array.from(collectionsWithCounts.values()).map((col) => (
                                <option key={col.id} value={col.id}>{col.title} ({col.totalPrompts})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.tags')}</label>
                        <TagSelector initialTags={tags} />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">{t('form.labels.description')}</label>
                        <ExpandableTextarea
                            name="description"
                            className="input h-20 resize-y"
                            placeholder={t('form.placeholders.description')}
                            data-lpignore="true"
                            label={t('form.labels.description')}
                        />
                    </div>
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

            <CollapsibleSection
                title={t('form.sections.shortPrompt')}
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

            <CollapsibleSection title={t('form.sections.usageExample')}>
                <ExpandableTextarea
                    name="usageExample"
                    className="input h-32 font-mono text-sm resize-y"
                    placeholder={t('form.placeholders.usage')}
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

            <CollapsibleSection title={t('form.sections.results')}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.textualResult')}</label>
                        <textarea
                            name="resultText"
                            className="input h-32 font-mono text-sm resize-y"
                            placeholder={t('form.placeholders.resultText')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('form.labels.resultFiles')}</label>
                        <div className="space-y-2 mb-2">
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

            <CollapsibleSection title={t('form.sections.attachments')}>
                <div className="space-y-4">
                    <label className="block text-sm font-medium mb-1">{t('form.labels.uploadFiles')}</label>
                    <div className="space-y-2 mb-2">
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

            <CollapsibleSection title={t('form.sections.source')}>
                <label className="block text-sm font-medium mb-1">{t('form.labels.resource')}</label>
                <input name="resource" type="text" className="input" placeholder={t('form.placeholders.resource')} data-lpignore="true" />
            </CollapsibleSection>

            <div className="flex justify-end gap-4 pt-4">
                <button type="submit" disabled={isPending} className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-primary/20">
                    {isPending ? t('form.buttons.creating') : t('form.buttons.createPrompt')}
                </button>
            </div>
        </form>
    );
}
