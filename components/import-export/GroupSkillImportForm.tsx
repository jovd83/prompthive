"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import { importGroupSkills } from "@/actions/skills";

export default function GroupSkillImportForm() {
    const { t } = useLanguage();
    const [urlsInput, setUrlsInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!urlsInput.trim()) return;

        setIsLoading(true);
        setStatus(null);

        try {
            const urls = urlsInput.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
            const res = await importGroupSkills(urls);

            if (res.success) {
                setStatus({
                    type: "success",
                    message: `Successfully imported ${res.count} skill(s) into a new collection.`
                });
                
                if (res.errors && res.errors.length > 0) {
                    console.warn("Some imports failed:", res.errors);
                }
                
                setUrlsInput("");
            } else {
                setStatus({
                    type: "error",
                    message: "Failed to import skills."
                });
            }
        } catch (err: any) {
            setStatus({
                type: "error",
                message: err.message || "An error occurred during import."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">
                    GitHub Repository URLs (one per line or comma-separated)
                </label>
                <textarea
                    value={urlsInput}
                    onChange={(e) => setUrlsInput(e.target.value)}
                    className="input w-full min-h-[150px] font-mono text-sm"
                    placeholder="https://github.com/owner/repo1&#10;https://github.com/owner/repo2"
                    required
                />
            </div>

            {status && (
                <div className={`p-4 rounded-md ${
                    status.type === "success" 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}>
                    {status.message}
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading || !urlsInput.trim()}
                className="btn btn-primary"
            >
                {isLoading ? "Importing..." : "Import Group Skills"}
            </button>
        </form>
    );
}
