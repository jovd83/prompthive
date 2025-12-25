"use client";

import * as Diff from 'diff';
import { useMemo } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

interface VisualDiffProps {
    oldText: string;
    newText: string;
    oldVersionLabel?: string;
    newVersionLabel?: string;
    onClose: () => void;
    mode?: 'words' | 'lines';
}

export default function VisualDiff({
    oldText,
    newText,
    oldVersionLabel = "Original",
    newVersionLabel = "New",
    onClose,
    mode = 'words'
}: VisualDiffProps) {
    const { t } = useLanguage();

    const changes = useMemo(() => {
        // Fallback for empty strings to avoid crashes
        const o = oldText || "";
        const n = newText || "";

        try {
            // Handle various import scenarios (ESM/CJS)
            const d = (Diff as any).default || Diff;

            if (mode === 'words') {
                if (typeof d.diffWords === 'function') return d.diffWords(o, n);
            } else {
                if (typeof d.diffLines === 'function') return d.diffLines(o, n);
            }
            console.error("Diff function not found in library", d);
            return [];
        } catch (e) {
            console.error("Diff generation error:", e);
            return [];
        }
    }, [oldText, newText, mode]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-background w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold">{t('diff.title')}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-mono">
                                {oldVersionLabel}
                            </span>
                            <ArrowRight size={16} className="text-muted-foreground" />
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-mono">
                                {newVersionLabel}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        title={t('diff.close')}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Diff Content */}
                <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed bg-surface whitespace-pre-wrap">
                    {changes.map((part: any, index: number) => {
                        const color = part.added
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-b-2 border-green-300 dark:border-green-700'
                            : part.removed
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through decoration-red-500/50 opacity-70'
                                : 'text-foreground/80';

                        // For diffLines, we might want to ensure they render as blocks if they contain newlines
                        const isBlock = mode === 'lines' && (part.added || part.removed);

                        return (
                            <span
                                key={index}
                                className={`${color} ${isBlock ? 'block w-full px-2 my-0.5' : ''} transition-colors duration-200`}
                            >
                                {part.value}
                            </span>
                        );
                    })}
                </div>

                {/* Legend/Footer */}
                <div className="px-6 py-3 bg-muted/10 border-t border-border flex gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-green-500 rounded-sm opacity-50"></span>
                        {t('diff.added')}
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-sm opacity-50"></span>
                        {t('diff.removed')}
                    </span>
                </div>
            </div>
        </div>
    );
}
