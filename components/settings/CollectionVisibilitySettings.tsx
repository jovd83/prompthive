"use client";

import { useState } from "react";
import CollectionTree from "@/components/CollectionTree";
import { saveCollectionVisibilityAction } from "@/actions/settings";
import { useRouter } from "next/navigation";
import { Loader2, EyeOff, Save } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function CollectionVisibilitySettings({
    allCollections = [],
    initialHiddenIds = [],
    currentUserId
}: {
    allCollections: any[],
    initialHiddenIds: string[],
    currentUserId: string
}) {
    const { t } = useLanguage();
    const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set(initialHiddenIds));
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const router = useRouter();

    const getAllIds = (collections: any[]) => collections.map(c => c.id);
    const allIdsList = getAllIds(allCollections);

    // Calculate visible set for UI
    const visibleIds = new Set(allIdsList.filter(id => !hiddenIds.has(id)));

    const handleToggle = (id: string, isNowChecked: boolean) => {
        const newHiddenSet = new Set(hiddenIds);
        if (isNowChecked) {
            newHiddenSet.delete(id);
        } else {
            newHiddenSet.add(id);
        }
        setHiddenIds(newHiddenSet);
    };

    const handleCheckAll = () => setHiddenIds(new Set());
    const handleUncheckAll = () => {
        setHiddenIds(new Set(allIdsList));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        setMessageType('');
        try {
            await saveCollectionVisibilityAction(Array.from(hiddenIds));
            setMessage(t('settings.settingsSaved') || "Settings saved successfully.");
            setMessageType('success');
            router.refresh();
        } catch (error) {
            console.error(error);
            setMessage(t('settings.settingsFailed') || "Failed to save settings.");
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="card space-y-6 mb-6">
            {message && (
                <div className={`p-3 rounded text-sm ${messageType === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {message}
                </div>
            )}

            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <EyeOff size={20} />
                    {t('settings.collectionVisibility')}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {t('settings.collectionVisibilityDesc')}
                </p>

                <div className="flex gap-2 mb-2">
                    <button type="button" onClick={handleCheckAll} className="text-xs btn btn-sm btn-ghost">{t('settings.checkAll')}</button>
                    <button type="button" onClick={handleUncheckAll} className="text-xs btn btn-sm btn-ghost">{t('settings.uncheckAll')}</button>
                </div>

                <div className="border border-border rounded-lg p-4 max-h-[400px] overflow-y-auto">
                    <CollectionTree
                        collections={allCollections}
                        mode="selection"
                        checkedIds={visibleIds} // Pass VISIBLE ids so they appear checked
                        onToggle={handleToggle}
                        currentUserId={currentUserId}
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn btn-primary flex items-center gap-2"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {t('settings.saveVisibility')}
                </button>
            </div>
        </div>
    );
}
