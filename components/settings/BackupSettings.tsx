
"use client";

import { useState } from "react";
import { saveSettings } from "@/actions/backup";
import { Save } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { Settings } from "@/types/settings";

export default function BackupSettings({ initialSettings }: { initialSettings: Settings }) {
    const { t } = useLanguage();
    const [settings, setSettings] = useState(initialSettings);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleChange = (field: keyof Settings, value: any) => {
        setSettings({ ...settings, [field]: value });
    };

    const handleSaveBackup = async () => {
        setIsSaving(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("autoBackupEnabled", String(settings.autoBackupEnabled));
            formData.append("backupPath", settings.backupPath || "");
            formData.append("backupFrequency", settings.backupFrequency);

            await saveSettings(formData);
            setMessage(t('settings.settingsSaved'));
        } catch (err: any) {
            setMessage("Error saving backup settings: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card space-y-6">
            {message && (
                <div className={`p-3 rounded text-sm ${message.includes("Saved") || message.includes("success") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {message}
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold mb-4">{t('settings.autoBackupConfig')}</h2>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="autoBackup"
                            checked={settings.autoBackupEnabled}
                            onChange={(e) => handleChange("autoBackupEnabled", e.target.checked)}
                            className="w-5 h-5 accent-primary"
                        />
                        <label htmlFor="autoBackup" className="font-medium">{t('settings.enableAutoBackup')}</label>
                    </div>

                    <div>
                        <label htmlFor="backupPath" className="block text-sm font-medium mb-1">{t('settings.backupPath')}</label>
                        <input
                            type="text"
                            id="backupPath"
                            value={settings.backupPath || ""}
                            onChange={(e) => handleChange("backupPath", e.target.value)}
                            className="input"
                            placeholder="C:\\Backups\\MyPromptHive"
                            disabled={!settings.autoBackupEnabled}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.backupPathDesc')}
                        </p>
                    </div>

                    <div>
                        <label htmlFor="backupFrequency" className="block text-sm font-medium mb-1">{t('settings.backupFrequency')}</label>
                        <select
                            id="backupFrequency"
                            value={settings.backupFrequency}
                            onChange={(e) => handleChange("backupFrequency", e.target.value)}
                            className="input"
                            disabled={!settings.autoBackupEnabled}
                        >
                            <option value="DAILY">{t('settings.daily')}</option>
                            <option value="WEEKLY">{t('settings.weekly')}</option>
                            <option value="MONTHLY">{t('settings.monthly')}</option>
                        </select>
                    </div>
                    <div className="pt-2">
                        <a
                            href="/api/export"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                            {t('settings.backupNow')}
                        </a>
                        <p className="text-xs text-muted-foreground mt-2">
                            {t('settings.backupNowDesc')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button
                    type="button"
                    onClick={handleSaveBackup}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    <Save size={18} />
                    {isSaving ? t('settings.saving') : t('settings.saveBackup')}
                </button>
            </div>
        </div>
    );
}
