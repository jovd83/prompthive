"use client";

import ExpandableTextarea from "@/components/ExpandableTextarea";
import { useLanguage } from "@/components/LanguageProvider";
import PromptVersionHistory from "./PromptVersionHistory";
import { PromptWithRelations } from "@/types/prisma";
import { VariableDef } from "@/lib/prompt-utils";

interface PromptSidebarProps {
    prompt: PromptWithRelations;
    selectedVersionId: string;
    selectedVersionNumber: number;
    uniqueVars: string[];
    variableDefs: VariableDef[];
    variables: Record<string, string>;
    fillVariable: (key: string, value: string) => void;
    onSelectVersion: (id: string) => void;
    onRestore: (id: string) => void;
    onCompare: (version: any) => void;
}

export default function PromptSidebar({
    prompt,
    selectedVersionId,
    selectedVersionNumber,
    uniqueVars,
    variableDefs,
    variables,
    fillVariable,
    onSelectVersion,
    onRestore,
    onCompare
}: PromptSidebarProps) {
    const { t } = useLanguage();

    return (
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

                                    <ExpandableTextarea
                                        id={v}
                                        value={variables[v] || ""}
                                        onChange={(e) => fillVariable(v, e.target.value)}
                                        className="input text-sm bg-background min-h-[80px] pr-8 resize-y"
                                        placeholder={t('detail.placeholders.valueFor').replace('{{name}}', v)}
                                        label={`${t('detail.labels.editingVariable') || "Editing"}: ${v}`}
                                        modalDescription={def?.description}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <PromptVersionHistory
                prompt={prompt}
                selectedVersionId={selectedVersionId}
                selectedVersionNumber={selectedVersionNumber}
                onSelectVersion={onSelectVersion}
                onRestore={onRestore}
                onCompare={onCompare}
            />
        </div>
    );
}
