"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Code2, Copy, Check, Paperclip, Download, Lock } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import CodeEditor from "@/components/CodeEditor";
import CollapsibleSection from "@/components/CollapsibleSection";
import { PromptWithRelations, TagWithCount } from "@/types/prisma";
import { VariableDef, replaceVariables } from "@/lib/prompt-utils";
import { copyToClipboard } from "@/lib/clipboard";

interface PromptContentProps {
    prompt: PromptWithRelations;
    selectedVersion: any; // Using any for version to match loose types in main file for now, ideally PromptVersion
    variableDefs: VariableDef[];
    variables: Record<string, string>;
}

export default function PromptContent({ prompt, selectedVersion, variableDefs, variables }: PromptContentProps) {
    const { t } = useLanguage();
    const [isCodeView, setIsCodeView] = useState(false);
    const [isLongCodeView, setIsLongCodeView] = useState(false);
    const [copied, setCopied] = useState(false);

    const allAttachments = selectedVersion.attachments || [];
    const resultAttachments = allAttachments.filter((a: any) => a.role === 'RESULT');
    const generalAttachments = allAttachments.filter((a: any) => a.role !== 'RESULT');
    const showLegacyResultImage = resultAttachments.length === 0 && selectedVersion.resultImage;

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

    return (
        <div className="space-y-6">
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
                                {resultAttachments.map((att: any) => (
                                    <div key={att.id}>
                                        {['.jpg', '.jpeg', '.png', '.gif', '.svg'].some(ext => att.filePath.toLowerCase().endsWith(ext)) ? (
                                            <a href={att.filePath} target="_blank" rel="noopener noreferrer">
                                                <img src={att.filePath} alt="Result" className="w-full rounded-lg border border-border hover:shadow-md transition-shadow" />
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50 opacity-60 cursor-not-allowed" title="Downloads are restricted for Guest users">
                                                <div className="bg-primary/10 p-2 rounded-md text-primary">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{att.filePath.split('/').pop()}</p>
                                                    <p className="text-xs text-muted-foreground">{t('detail.actions.download')} (Locked)</p>
                                                </div>
                                                <Lock size={16} className="text-muted-foreground" />
                                            </div>
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
                        {generalAttachments.map((att: any) => (
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
    );
}
