"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import CollectionTree from "../CollectionTree";
import { Loader2, Check } from "lucide-react";

export default function ExportZeroForm({ collections }: { collections: any[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);
    const { t } = useLanguage();

    const handleSelectAll = () => {
        setSelectedIds(new Set(collections.map(c => c.id)));
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleExport = async () => {
        if (selectedIds.size === 0) return;
        setIsExporting(true);
        try {
            const res = await fetch('/api/export-zero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionIds: Array.from(selectedIds) })
            });

            if (!res.ok) throw new Error("Export failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `prompthive-zero-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert("Failed to export");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2 mb-2">
                <button type="button" onClick={handleSelectAll} className="text-xs btn btn-ghost h-8 px-2">
                    {t('common.selectAll') || "Select All"}
                </button>
                <button type="button" onClick={handleDeselectAll} className="text-xs btn btn-ghost h-8 px-2">
                    {t('common.deselectAll') || "Deselect All"}
                </button>
            </div>

            {/* Tree View */}
            <div className="max-h-64 overflow-y-auto border rounded p-2 bg-muted/20">
                <CollectionTree
                    collections={collections}
                    mode="selection"
                    variant="default" // No EyeOff icons
                    checkedIds={selectedIds}
                    onToggle={toggleSelection}
                />
            </div>

            <button
                onClick={handleExport}
                disabled={selectedIds.size === 0 || isExporting}
                className="btn btn-primary w-full"
            >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : t('importExport.exportZeroButton')}
            </button>
        </div>
    );
}
