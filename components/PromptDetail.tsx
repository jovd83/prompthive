
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { enUS, nl, fr } from "date-fns/locale";
import ConfirmationDialog from "./ConfirmationDialog";
import { Copy, Edit, History, FileText, Check, Paperclip, Download, Code2, Trash2, GitCompare, Heart, Maximize2, X, FileDown, RotateCcw } from "lucide-react";
import CollapsibleSection from "./CollapsibleSection";
import Link from "next/link";
import CodeEditor from "./CodeEditor";
import VisualDiff from "./VisualDiff";
import { useLanguage } from "./LanguageProvider";
import { usePromptDetails, PromptWithRelations } from "@/hooks/usePromptDetails";
import { VariableDef, replaceVariables } from "@/lib/prompt-utils";
import { copyToClipboard } from "@/lib/clipboard";
import { generateMarkdown, downloadStringAsFile } from "@/lib/markdown";
import { restorePromptVersion } from "@/actions/prompts";

type PromptDetailProps = {
    prompt: PromptWithRelations;
    isFavorited?: boolean;
    serverParsedVariables?: VariableDef[];
    collectionPaths?: { id: string, title: string }[][];
};

const localeMap: Record<string, any> = { en: enUS, nl: nl, fr: fr };

export default function PromptDetail({ prompt, isFavorited: initialIsFavorited = false, serverParsedVariables, collectionPaths }: PromptDetailProps) {
    const { t, language } = useLanguage();

    // Use the Hook
    const {
        selectedVersionId,
        setSelectedVersionId,
        selectedVersion,
        variables,
        fillVariable,
        isFavorited,
        handleToggleFavorite,
        isDeleting,
        setIsDeleting,
        confirmDelete,
        error,
        diffConfig,
        setDiffConfig,
        variableDefs,
        uniqueVars
    } = usePromptDetails({ prompt, initialIsFavorited, parsedVariableDefs: serverParsedVariables });

    // Local UI state
    const [copied, setCopied] = useState(false);
    const [isCodeView, setIsCodeView] = useState(false);
    const [isLongCodeView, setIsLongCodeView] = useState(false); // keeping var name internal for now or rename? logic is same. Let's keep internal vars stable to avoid excessive churn.
    const [expandedVariable, setExpandedVariable] = useState<string | null>(null);
    const [versionToRestore, setVersionToRestore] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Derived UI State
    if (!selectedVersion) return <div>{t('detail.placeholders.noVersions')}</div>;

    const allAttachments = selectedVersion.attachments || [];
    const resultAttachments = allAttachments.filter((a) => a.role === 'RESULT');
    const generalAttachments = allAttachments.filter((a) => a.role !== 'RESULT');
    const showLegacyResultImage = resultAttachments.length === 0 && selectedVersion.resultImage;
    const timeAgo = formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: false, locale: localeMap[language] || enUS });

    const handleCopy = async () => {
        const content = replaceVariables(selectedVersion.content, variables);

        const success = await copyToClipboard(content);

        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            fetch("/api/analytics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ promptId: prompt.id, type: "copy" }),
            }).catch(console.error);
        }
    };

    const handleDownloadMarkdown = () => {
        if (!selectedVersion) return;
        const md = generateMarkdown(prompt, selectedVersion.id);
        const slug = prompt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${slug}_v${selectedVersion.versionNumber}.md`;
        downloadStringAsFile(md, filename);
    };

    const handleRestoreClick = (versionId: string) => {
        setVersionToRestore(versionId);
    };

    const handleConfirmRestore = async () => {
        if (!versionToRestore) return;

        try {
            await restorePromptVersion(prompt.id, versionToRestore);
            setSuccessMessage(t('detail.actions.restoreSuccess') || "Version restored successfully.");
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err: any) {
            // Next.js redirect() throws an error. We want to let it propagate if it's a redirect.
            if (err.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
                throw err;
            }
            console.error("Failed to restore version:", err);
            setErrorMessage(t('detail.errors.restoreFailed') || "Failed to restore version.");
            setTimeout(() => setErrorMessage(null), 5000);
            // Alert backup as valid fallback if UI fails
            // alert(`Failed to restore version: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setVersionToRestore(null);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-12">
            {/* Breadcrumbs */}
            {/* Breadcrumbs */}
            <div className="mb-4 flex flex-col gap-1">
                {(collectionPaths && collectionPaths.length > 0 ? collectionPaths : (prompt.collections || []).map((col: any) => [{ id: col.id, title: col.title }])).map((path, idx) => (
                    <div key={idx} className="flex items-center text-sm text-muted-foreground">
                        <Link href="/collections" className="hover:text-primary transition-colors">{t('detail.breadcrumbs.collections')}</Link>
                        {path.map((crumb) => (
                            <div key={crumb.id} className="flex items-center">
                                <span className="mx-1">/</span>
                                <Link href={`/collections/${crumb.id}`} className="hover:text-primary transition-colors">
                                    {crumb.title}
                                </Link>
                            </div>
                        ))}
                    </div>
                ))}

                {/* Fallback if absolutely no collections (unassigned) - show just root link? 
                    Actually, if unassigned, we might not want to show breadcrumbs at all or just "Collections".
                    Let's show "Collections" only if user is in unassigned context? 
                    Usually breadcrumbs implies "You are here". If "Unassigned", maybe "Collections / Unassigned"?
                    For now, the loop above covers assigned cases.
                    If the resulting array is empty (unassigned), we render ... nothing?
                    Let's revert to: Only render if we have paths.
                    BUT user said it disappeared. This implies they HAVE collections.
                    So the above logic handles it.
                */}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{prompt.title}</h1>
                    <div className="flex gap-2 text-sm text-muted-foreground items-center">
                        <span>{t('detail.meta.by')} {prompt.createdBy.username}</span>
                        <span>•</span>
                        <span>{t('detail.meta.ago').replace('{{time}}', timeAgo)}</span>
                        <div className="flex gap-1 ml-2">
                            {prompt.tags && prompt.tags.map((tag) => (
                                <Link key={tag.id} href={`/?tags=${tag.id}`} className="bg-secondary px-2 py-0.5 rounded-full text-xs hover:bg-primary hover:text-primary-foreground transition-colors">#{tag.name}</Link>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={handleToggleFavorite}
                        className={`btn border border-border hover:bg-background ${isFavorited ? "text-red-500 border-red-200 bg-red-50 dark:bg-red-950/20" : "bg-surface"}`}
                        title={isFavorited ? t('detail.actions.removeFromFavorites') : t('detail.actions.addToFavorites')}
                    >
                        <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
                    </button>

                    <button
                        onClick={handleDownloadMarkdown}
                        className="btn border border-border hover:bg-background bg-surface"
                        title={t('detail.actions.downloadMarkdown') || "Download Markdown"}
                    >
                        <FileDown size={20} />
                    </button>

                    {error && <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">{error}</span>}
                    {errorMessage && <span className="text-sm text-red-500 bg-red-50 px-2 py-1 rounded border border-red-100">{errorMessage}</span>}
                    {successMessage && <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 animate-in fade-in slide-in-from-top-1">{successMessage}</span>}

                    {isDeleting ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <span className="text-sm font-bold text-red-600">{t('detail.actions.confirmDelete')}</span>
                            <button onClick={confirmDelete} className="btn btn-sm bg-red-600 text-white hover:bg-red-700">{t('detail.actions.yes')}</button>
                            <button onClick={() => setIsDeleting(false)} className="btn btn-sm bg-surface text-foreground border border-border hover:bg-muted">{t('detail.actions.no')}</button>
                        </div>
                    ) : (
                        <>
                            <Link href={`/prompts/${prompt.id}/edit`} className="btn bg-surface border border-border hover:bg-background" title={t('detail.actions.edit')}>
                                <Edit size={16} />
                            </Link>
                            <button
                                onClick={() => setIsDeleting(true)}
                                className="btn bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 dark:bg-red-950/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/20"
                                title={t('detail.actions.delete')}
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card space-y-4">
                        <div>
                            <h3 className="font-bold mb-2 text-sm text-muted-foreground">{t('detail.labels.description')}</h3>
                            <p>{prompt.description || <span className="text-muted-foreground/60 italic">{t('detail.placeholders.noDescription')}</span>}</p>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <FileText size={20} /> {t('detail.labels.promptContent')}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsCodeView(!isCodeView)}
                                    className={`text-xs flex items-center gap-1 border border-border px-2 py-1.5 rounded hover:bg-surface transition-colors ${isCodeView ? 'text-primary border-primary bg-primary/5' : 'text-muted-foreground'}`}
                                >
                                    <Code2 size={14} /> {t('detail.actions.codeView')}
                                </button>
                                <button onClick={handleCopy} className="btn btn-primary py-1.5 px-3 text-sm shadow-md shadow-primary/20">
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? t('detail.actions.copied') : t('detail.actions.copy')}
                                </button>
                            </div>
                        </div>
                        {isCodeView ? (
                            <CodeEditor value={selectedVersion.content} onChange={() => { }} className="min-h-[150px]" />
                        ) : (
                            <div className="bg-background p-4 rounded-md font-mono text-sm whitespace-pre-wrap border border-border min-h-[150px]">
                                {selectedVersion.content}
                            </div>
                        )}
                    </div>

                    {selectedVersion.shortContent && (
                        <CollapsibleSection
                            title={t('detail.labels.shortPrompt')}
                            action={
                                <button
                                    onClick={() => setIsLongCodeView(!isLongCodeView)}
                                    className={`text-xs flex items-center gap-1 border border-border px-2 py-1.5 rounded hover:bg-surface transition-colors ${isLongCodeView ? 'text-primary border-primary bg-primary/5' : 'text-muted-foreground'}`}
                                >
                                    <Code2 size={14} /> {t('detail.actions.codeView')}
                                </button>
                            }
                        >
                            <div className="relative">
                                {isLongCodeView ? (
                                    <CodeEditor value={selectedVersion.shortContent} onChange={() => { }} />
                                ) : (
                                    <div className="font-mono text-sm whitespace-pre-wrap">{selectedVersion.shortContent}</div>
                                )}
                            </div>
                        </CollapsibleSection>
                    )}

                    {selectedVersion.usageExample && (
                        <CollapsibleSection title={t('detail.labels.usageExample')}>
                            <div className="font-mono text-sm whitespace-pre-wrap">{selectedVersion.usageExample}</div>
                        </CollapsibleSection>
                    )}

                    {prompt.collections && prompt.collections.length > 0 && (
                        <div className="card">
                            <h3 className="font-bold mb-2 text-sm text-muted-foreground">{t('detail.labels.collections')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {prompt.collections.map((col: any) => (
                                    <Link key={col.id} href={`/collections/${col.id}`} className="text-sm text-primary hover:underline bg-primary/10 px-2 py-1 rounded-md">
                                        {col.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {selectedVersion.changelog && (
                        <div className="card">
                            <h3 className="font-bold mb-2 text-sm text-muted-foreground">{t('detail.labels.changelog')} (v{selectedVersion.versionNumber})</h3>
                            <p className="text-sm">{selectedVersion.changelog}</p>
                        </div>
                    )}

                    {variableDefs.length > 0 && (
                        <CollapsibleSection title={t('detail.labels.variables')}>
                            <div className="space-y-2">
                                {variableDefs.map((v, i) => (
                                    <div key={i} className="text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                                        <span className="font-mono bg-muted px-1 rounded text-xs mr-2">{v.key}</span>
                                        <span className="text-muted-foreground">{v.description}</span>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleSection>
                    )}

                    {/* Results Section */}
                    {(selectedVersion.resultText || resultAttachments.length > 0 || showLegacyResultImage) && (
                        <div className="card">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Check size={18} /> {t('detail.labels.results')}
                            </h3>
                            {selectedVersion.resultText && (
                                <div className="mb-4">
                                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">{t('detail.labels.textResult')}</h4>
                                    <div className="bg-background p-4 rounded-md font-mono text-sm whitespace-pre-wrap border border-border">
                                        {selectedVersion.resultText}
                                    </div>
                                </div>
                            )}
                            {(resultAttachments.length > 0 || showLegacyResultImage) && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">{t('detail.labels.imageResult')}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {resultAttachments.map((att) => (
                                            <div key={att.id}>
                                                {['.jpg', '.jpeg', '.png', '.gif', '.svg'].some(ext => att.filePath.toLowerCase().endsWith(ext)) ? (
                                                    <a href={att.filePath} target="_blank" rel="noopener noreferrer">
                                                        <img src={att.filePath} alt="Result" className="w-full rounded-lg border border-border hover:shadow-md transition-shadow" />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={att.filePath}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-background transition-colors"
                                                    >
                                                        <div className="bg-primary/10 p-2 rounded-md text-primary">
                                                            <FileText size={20} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{att.filePath.split('/').pop()}</p>
                                                            <p className="text-xs text-muted-foreground">{t('detail.actions.download')}</p>
                                                        </div>
                                                        <Download size={16} className="text-muted-foreground" />
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                        {showLegacyResultImage && selectedVersion.resultImage && (
                                            <div>
                                                <a href={selectedVersion.resultImage} target="_blank" rel="noopener noreferrer">
                                                    <img src={selectedVersion.resultImage} alt="Result" className="w-full rounded-lg border border-border hover:shadow-md transition-shadow" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {generalAttachments.length > 0 && (
                        <div className="card">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Paperclip size={18} /> {t('detail.labels.attachments')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {generalAttachments.map((att) => (
                                    <a
                                        key={att.id}
                                        href={att.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-background transition-colors"
                                    >
                                        <div className="bg-primary/10 p-2 rounded-md text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{att.filePath.split('/').pop()}</p>
                                            <p className="text-xs text-muted-foreground">{att.fileType}</p>
                                        </div>
                                        <Download size={16} className="text-muted-foreground" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {prompt.resource && (
                        <div className="card">
                            <h3 className="font-bold mb-4 text-sm text-muted-foreground flex items-center gap-2">
                                <span className="i-lucide-external-link">🔗</span> {t('detail.labels.source')}
                            </h3>
                            {prompt.resource.match(/^https?:\/\//) ? (
                                <a
                                    href={prompt.resource}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all block"
                                >
                                    {prompt.resource}
                                </a>
                            ) : (
                                <p className="break-all whitespace-pre-wrap">{prompt.resource}</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar (Variables & History) */}
                <div className="space-y-6">
                    {uniqueVars.length > 0 && (
                        <div className="card border-primary/20 bg-primary/5">
                            <h3 className="font-bold mb-4 text-primary">{t('detail.labels.fillVariables')}</h3>
                            <div className="space-y-3">
                                {uniqueVars.map((v) => {
                                    const def = variableDefs.find((d) => d.key === v);
                                    return (
                                        <div key={v}>
                                            <label htmlFor={v} className="block text-sm font-medium mb-1">{v}</label>
                                            {def?.description && <p className="text-xs text-muted-foreground mb-1">{def.description}</p>}
                                            <div className="relative">
                                                <textarea
                                                    id={v}
                                                    value={variables[v] || ""}
                                                    onChange={(e) => fillVariable(v, e.target.value)}
                                                    className="input text-sm bg-background min-h-[80px] pr-8 resize-y"
                                                    placeholder={t('detail.placeholders.valueFor').replace('{{name}}', v)}
                                                />
                                                <button
                                                    onClick={() => setExpandedVariable(v)}
                                                    className="absolute top-2 right-2 text-muted-foreground hover:text-primary transition-colors p-1 rounded hover:bg-muted"
                                                    title={t('detail.actions.maximize') || "Maximize"}
                                                >
                                                    <Maximize2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="card">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <History size={18} /> {t('detail.labels.history')}
                        </h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {prompt.versions.map((v) => (
                                <div
                                    key={v.id}
                                    className={`w-full p-2 rounded-md text-sm flex justify-between items-center transition-colors group border ${selectedVersionId === v.id ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-background border-transparent"
                                        }`}
                                >
                                    <button
                                        onClick={() => setSelectedVersionId(v.id)}
                                        className="flex-1 text-left flex justify-between items-center"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{t('detail.meta.version')} {v.versionNumber}</span>
                                            <span className="text-xs text-muted-foreground">{t('detail.meta.by')} {v.createdBy?.username || t('detail.meta.unknown')}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground mr-2">{formatDistanceToNow(new Date(v.createdAt), { addSuffix: false, locale: localeMap[language] || enUS })}</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.stopPropagation();
                                                handleRestoreClick(v.id);
                                            }}
                                            className="p-1.5 hover:text-primary hover:bg-primary/10 rounded transition-all text-muted-foreground"
                                            title={t('detail.actions.restore') || "Restore this version"}
                                        >
                                            <RotateCcw size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDiffConfig({
                                                    oldVersion: v.versionNumber < selectedVersion.versionNumber ? v : selectedVersion,
                                                    newVersion: v.versionNumber < selectedVersion.versionNumber ? selectedVersion : v
                                                });
                                            }}
                                            className={`p-1.5 hover:text-primary hover:bg-primary/10 rounded transition-all ${selectedVersionId === v.id ? 'text-primary/50' : 'text-muted-foreground'}`}
                                            title={t('detail.actions.compare').replace('{{v1}}', v.versionNumber.toString()).replace('{{v2}}', selectedVersion.versionNumber.toString())}
                                        >
                                            <GitCompare size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {diffConfig && (
                <VisualDiff
                    oldText={diffConfig.oldVersion.content}
                    newText={diffConfig.newVersion.content}
                    oldVersionLabel={`v${diffConfig.oldVersion.versionNumber}`}
                    newVersionLabel={`v${diffConfig.newVersion.versionNumber}`}
                    onClose={() => setDiffConfig(null)}
                />
            )}

            {/* Variable Expansion Modal */}
            {expandedVariable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-4xl h-[80vh] bg-background border border-border shadow-2xl rounded-lg flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-border">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Edit size={18} /> {t('detail.labels.editingVariable') || "Editing"}: <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">{expandedVariable}</span>
                                </h3>
                                {variableDefs.find(d => d.key === expandedVariable)?.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {variableDefs.find(d => d.key === expandedVariable)?.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setExpandedVariable(null)}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-4 bg-muted/20">
                            <textarea
                                value={variables[expandedVariable] || ""}
                                onChange={(e) => fillVariable(expandedVariable, e.target.value)}
                                className="w-full h-full p-4 rounded-md border border-border bg-background shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-mono text-sm leading-relaxed"
                                placeholder={t('detail.placeholders.enterLargeText') || "Enter regular or large text here..."}
                                autoFocus
                            />
                        </div>
                        <div className="p-4 border-t border-border flex justify-end gap-2 bg-background rounded-b-lg">
                            <button
                                onClick={() => setExpandedVariable(null)}
                                className="btn btn-primary px-6"
                            >
                                {t('detail.actions.done') || "Done"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Restore Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={!!versionToRestore}
                onClose={() => setVersionToRestore(null)}
                onConfirm={handleConfirmRestore}
                title={t('detail.actions.restore') || "Restore Version"}
                description={t('detail.actions.confirmRestore') || "Are you sure you want to restore this version? This will create a new version with the same content."}
                confirmLabel={t('detail.actions.restore') || "Restore"}
                cancelLabel={t('common.cancel')}
            />
        </div>
    );
}
