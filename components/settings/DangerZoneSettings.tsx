
"use client";

import { useState } from "react";
import { dropAllData, restoreLatestBackup } from "@/actions/backup";
import { deleteUnusedTags } from "@/actions/prompts";
import { Trash2, RotateCcw, Tag as TagIcon } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

function DeleteButton({ onConfirm, disabled }: { onConfirm: () => void, disabled: boolean }) {
    const [step, setStep] = useState<'initial' | 'confirm'>('initial');
    const { t } = useLanguage();

    if (step === 'confirm') {
        return (
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => { onConfirm(); setStep('initial'); }}
                    className="btn bg-red-600 text-white hover:bg-red-700 animate-in fade-in zoom-in-95 duration-200"
                    disabled={disabled}
                >
                    <Trash2 size={18} /> {t('settings.confirmDelete')}
                </button>
                <button
                    type="button"
                    onClick={() => setStep('initial')}
                    className="btn bg-gray-100 text-gray-700 hover:bg-gray-200"
                    disabled={disabled}
                >
                    {t('settings.cancel')}
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setStep('confirm')}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50"
            disabled={disabled}
        >
            <Trash2 size={18} /> {t('settings.dropAllContent')}
        </button>
    );
}

export default function DangerZoneSettings() {
    const { t } = useLanguage();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    return (
        <>
            {message && (
                <div className={`mb-6 p-3 rounded text-sm ${message.includes("success") || message.includes("Complete") || message.includes("Cleared") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {message}
                </div>
            )}

            <div className="card space-y-6 mt-6">
                <h2 className="text-xl font-bold">{t('settings.dataMaintenance')}</h2>
                <div>
                    <h3 className="font-medium mb-2">{t('settings.cleanupTags')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        {t('settings.cleanupTagsDesc')}
                    </p>
                    <button
                        type="button"
                        onClick={async () => {
                            setIsSaving(true);
                            try {
                                const result = await deleteUnusedTags();
                                setMessage(t('settings.cleanupComplete').replace('{{count}}', String(result.count)));
                            } catch (e: any) {
                                setMessage(t('settings.cleanupFailed').replace('{{error}}', e instanceof Error ? e.message : "Unknown error"));
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        className="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50"
                        disabled={isSaving}
                    >
                        <TagIcon size={18} /> {t('settings.deleteUnusedTags')}
                    </button>
                </div>
            </div>

            <div className="card space-y-6 mt-6 border-red-200 dark:border-red-900/50">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">{t('settings.dangerZone')}</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">{t('settings.restoreData')}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {t('settings.restoreDataDesc')}
                            <strong> {t('settings.warningOverwrite')}</strong>
                        </p>
                        <button
                            type="button"
                            onClick={async () => {
                                if (confirm(t('settings.restoreDataDesc') + " " + t('settings.warningOverwrite'))) {
                                    setIsSaving(true);
                                    try {
                                        const result = await restoreLatestBackup();
                                        setMessage(result.message);
                                    } catch (e: any) {
                                        setMessage(t('settings.restoreFailed').replace('{{error}}', e instanceof Error ? e.message : "Unknown error"));
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }
                            }}
                            className="btn bg-orange-50 text-orange-600 hover:bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/50"
                            disabled={isSaving}
                        >
                            <RotateCcw size={18} /> {t('settings.restoreButton')}
                        </button>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <h3 className="font-medium mb-2">{t('settings.resetDatabase')}</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            {t('settings.resetDatabaseDesc')}
                        </p>
                        <DeleteButton
                            onConfirm={async () => {
                                setIsSaving(true);
                                try {
                                    await dropAllData();
                                    setMessage(t('settings.dbCleared'));
                                    setTimeout(() => {
                                        window.location.reload();
                                    }, 1000);
                                } catch (e: any) {
                                    console.error("Drop data failed:", e);
                                    setMessage("Clear failed: " + (e instanceof Error ? e.message : "Unknown error"));
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            disabled={isSaving}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
