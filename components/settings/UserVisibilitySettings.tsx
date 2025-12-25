
"use client";

import { Save, User } from "lucide-react";
import { useLanguage } from "../LanguageProvider";
import { UserBasic } from "@/types/settings";
import { useState } from "react";
import { saveVisibilitySettings } from "@/actions/settings";

interface UserVisibilitySettingsProps {
    allUsers: UserBasic[];
    initialHiddenIds: Set<string>;
    currentUserId?: string;
}

export default function UserVisibilitySettings({ allUsers, initialHiddenIds, currentUserId }: UserVisibilitySettingsProps) {
    const { t } = useLanguage();
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(initialHiddenIds);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const toggleUserVisibility = (userId: string) => {
        if (userId === currentUserId) return;
        const newHidden = new Set(hiddenIds);
        if (newHidden.has(userId)) {
            newHidden.delete(userId);
        } else {
            newHidden.add(userId);
        }
        setHiddenIds(newHidden);
    };

    const handleCheckAll = () => setHiddenIds(new Set());
    const handleUncheckAll = () => {
        const allIds = allUsers.map(u => u.id).filter(id => id !== currentUserId);
        setHiddenIds(new Set(allIds));
    };

    const handleSaveVisibility = async () => {
        setIsSaving(true);
        setMessage("");
        try {
            const formData = new FormData();
            formData.append("hiddenUserIds", JSON.stringify(Array.from(hiddenIds)));
            await saveVisibilitySettings(null, formData);
            setMessage("Visibility settings saved successfully.");
        } catch (err: any) {
            // We can improve this ANY later by typing the error
            setMessage("Error saving visibility settings: " + (err instanceof Error ? err.message : "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card space-y-6 mb-6">
            {message && (
                <div className={`p-3 rounded text-sm ${message.includes("Saved") || message.includes("success") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {message}
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <User size={20} />
                    {t('settings.userVisibility')}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.userVisibilityDesc')}
                </p>

                <div className="flex gap-2 mb-2">
                    <button type="button" onClick={handleCheckAll} className="text-xs btn btn-sm btn-ghost">{t('settings.checkAll')}</button>
                    <button type="button" onClick={handleUncheckAll} className="text-xs btn btn-sm btn-ghost">{t('settings.uncheckAll')}</button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-border rounded-md p-2 space-y-1">
                    {allUsers.map(user => {
                        const isMe = user.id === currentUserId;
                        const isHidden = hiddenIds.has(user.id);
                        const isChecked = !isHidden;

                        return (
                            <div key={user.id} className={`flex items-center justify-between p-2 rounded hover:bg-muted/50 ${isMe ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-bold">{user.username.slice(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">{user.username} {isMe && t('settings.you')}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleUserVisibility(user.id)}
                                    disabled={isMe}
                                    className="checkbox"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button
                    type="button"
                    onClick={handleSaveVisibility}
                    className="btn btn-primary"
                    disabled={isSaving}
                >
                    <Save size={18} />
                    {isSaving ? t('settings.saving') : t('settings.saveVisibility')}
                </button>
            </div>
        </div>
    );
}
