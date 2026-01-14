"use client";

import { useState, useMemo, useEffect } from "react";
import { VariableDef, extractUniqueVariables } from "@/lib/prompt-utils";
import { PromptWithRelations } from "@/types/prisma";
import { usePromptAnalytics } from "./usePromptAnalytics";
import { usePromptActions } from "./usePromptActions";

export type UsePromptDetailsProps = {
    prompt: PromptWithRelations;
    initialIsFavorited?: boolean;
    parsedVariableDefs?: VariableDef[];
};

export function usePromptDetails({ prompt, initialIsFavorited = false, parsedVariableDefs }: UsePromptDetailsProps) {
    // 1. Analytics
    usePromptAnalytics(prompt.id);

    // 2. Actions (Favorite, Delete)
    const {
        isFavorited,
        isFavLoading,
        handleToggleFavorite,
        isDeleting,
        setIsDeleting,
        confirmDelete,
        error,
        setError
    } = usePromptActions({
        promptId: prompt.id,
        promptTitle: prompt.title,
        initialIsFavorited
    });

    // 3. Version & Variable State
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        prompt.currentVersionId || prompt.versions[0]?.id || ""
    );
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [diffConfig, setDiffConfig] = useState<{ oldVersion: any, newVersion: any } | null>(null);

    // Update selected version if prompt changes (revalidation)
    useEffect(() => {
        if (prompt.currentVersionId) {
            setSelectedVersionId(prompt.currentVersionId);
        }
    }, [prompt.currentVersionId]);

    const selectedVersion = useMemo(() =>
        prompt.versions.find((v) => v.id === selectedVersionId) || prompt.versions[0],
        [prompt.versions, selectedVersionId]);

    // Variable Extraction Logic
    const variableDefs: VariableDef[] = useMemo(() => {
        if (parsedVariableDefs && parsedVariableDefs.length > 0) return parsedVariableDefs;
        if (!selectedVersion?.variableDefinitions) return [];
        try {
            const parsed = JSON.parse(selectedVersion.variableDefinitions);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }, [selectedVersion?.variableDefinitions, parsedVariableDefs]);

    const uniqueVars = useMemo(() => {
        if (!selectedVersion?.content) return [];
        const detectedVars = extractUniqueVariables(selectedVersion.content);

        // Exclude attachment filenames
        const attachmentNames = new Set(
            (selectedVersion.attachments || []).map((a: any) => {
                const parts = a.filePath.split('/');
                return parts[parts.length - 1];
            })
        );

        const filteredVars = detectedVars.filter(v => !attachmentNames.has(v));
        return Array.from(new Set([...filteredVars, ...variableDefs.map((v) => v.key)]));
    }, [selectedVersion?.content, selectedVersion?.attachments, variableDefs]);

    const fillVariable = (key: string, value: string) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    };

    return {
        // Version
        selectedVersionId,
        setSelectedVersionId,
        selectedVersion,

        // Variables
        variables,
        fillVariable,
        variableDefs,
        uniqueVars,

        // Actions
        isFavorited,
        isFavLoading,
        handleToggleFavorite,
        isDeleting,
        setIsDeleting, // Exposed for cancel dialog
        handleDelete: () => setIsDeleting(true), // Wrapper to set deleting state
        confirmDelete,

        // UI State
        error,
        setError,
        diffConfig,
        setDiffConfig
    };
}
