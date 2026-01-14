"use client";

import { Save, Sliders } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

import { useState } from "react";
import { saveGeneralSettings } from "@/actions/settings";
import { Settings } from "@/types/settings";

interface GeneralSettingsProps {
    initialSettings: Settings;
}

export default function GeneralSettings({ initialSettings }: GeneralSettingsProps) {
    const { t } = useLanguage();
    const [showPrompterTips, setShowPrompterTips] = useState(initialSettings.showPrompterTips ?? true);
    const [tagColorsEnabled, setTagColorsEnabled] = useState(initialSettings.tagColorsEnabled ?? true);
    const [workflowVisible, setWorkflowVisible] = useState(initialSettings.workflowVisible ?? false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("showPrompterTips", showPrompterTips ? "on" : "off");
            formData.append("tagColorsEnabled", tagColorsEnabled ? "on" : "off");
            formData.append("workflowVisible", workflowVisible ? "on" : "off");
            await saveGeneralSettings(null, formData);
            setMessage("Settings saved successfully.");
        } catch (err: any) {
            setMessage("Error saving settings: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card space-y-6 mb-6">
            {message && (
                <div className={`p-3 rounded text-sm ${message.includes("Saved") || message.includes("successfully") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {message}
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sliders size={20} />
                    {t('settings.general') || "General Settings"}
                </h2>

                <label className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer">
                    <div>
                        <div className="font-medium text-sm">{t('settings.showTips') || "Show Prompting Tips"}</div>
                        <div className="text-xs text-muted-foreground">{t('settings.showTipsDesc') || "Display a daily prompting tip on the dashboard"}</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={showPrompterTips}
                        onChange={(e) => setShowPrompterTips(e.target.checked)}
                        className="checkbox"
                    />
                </label>

                <label className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer mt-2">
                    <div>
                        <div className="font-medium text-sm">{t('settings.tagColors') || "Enable Tag Colors"}</div>
                        <div className="text-xs text-muted-foreground">{t('settings.tagColorsDesc') || "Show distinct colors for each tag"}</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={tagColorsEnabled}
                        onChange={(e) => setTagColorsEnabled(e.target.checked)}
                        className="checkbox"
                    />
                </label>




                <label className="flex items-center justify-between p-2 rounded hover:bg-muted/50 cursor-pointer mt-2">
                    <div>
                        <div className="font-medium text-sm">{t('settings.showWorkflows') || "Show Workflows"}</div>
                        <div className="text-xs text-muted-foreground">{t('settings.showWorkflowsDesc') || "Enable the workflows feature in the sidebar"}</div>
                    </div>
                    <input
                        type="checkbox"
                        checked={workflowVisible}
                        onChange={(e) => setWorkflowVisible(e.target.checked)}
                        className="checkbox"
                        data-testid="workflow-toggle"
                    />
                </label>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    <Save size={18} />
                    {isSaving ? (t('settings.saving') || "Saving...") : (t('settings.saveGeneral') || "Save General Settings")}
                </button>
            </div>
        </div >
    );
}
