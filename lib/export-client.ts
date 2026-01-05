import { getExportMeta, getExportBatch } from "@/actions/export";

export async function exportCollection(collectionId: string, collectionName: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Get Meta (Recursive)
        const meta = await getExportMeta([collectionId], true);
        if (!meta.success || !meta.promptIds) {
            return { success: false, error: meta.error || "Failed to start export" };
        }

        const total = meta.totalPrompts || 0;
        const promptIds = meta.promptIds;
        const definedCollections = meta.definedCollections || [];

        let allPrompts: any[] = [];

        // 2. Batch Fetch
        const BATCH_SIZE = 20;
        for (let i = 0; i < total; i += BATCH_SIZE) {
            const batchIds = promptIds.slice(i, i + BATCH_SIZE);
            const batchRes = await getExportBatch(batchIds);

            if (!batchRes.success || !batchRes.prompts) {
                return { success: false, error: batchRes.error || "Batch export failed" };
            }
            allPrompts = allPrompts.concat(batchRes.prompts);
        }

        // 3. Assemble V2 JSON
        const exportObject = {
            version: 2,
            exportedAt: new Date().toISOString(),
            prompts: allPrompts,
            definedCollections: definedCollections
        };

        // 4. Client Download
        const jsonString = JSON.stringify(exportObject, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Clean name
        const cleanName = collectionName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `${cleanName}_backup.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return { success: true };
    } catch (e: any) {
        console.error("Export Error:", e);
        return { success: false, error: e.message || "An unexpected error occurred" };
    }
}
