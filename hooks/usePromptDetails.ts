
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Prisma } from "@prisma/client";
import { useSession, signIn } from "next-auth/react";
import { toggleFavorite } from "@/actions/favorites";
import { deletePrompt } from "@/actions/prompts";
import { useLanguage } from "@/components/LanguageProvider";
import { VariableDef, extractUniqueVariables } from "@/lib/prompt-utils";

// Define strict types for the hook
export type PromptWithRelations = Prisma.PromptGetPayload<{
    include: {
        versions: { include: { createdBy: true, attachments: true } };
        createdBy: true;
        collections: { include: { parent: true } };
        tags: true;
    }
}>;

// Extended type including the pre-parsed stuff if we want, but for now we keep it compatible
export type UsePromptDetailsProps = {
    prompt: PromptWithRelations;
    initialIsFavorited?: boolean;
    parsedVariableDefs?: VariableDef[]; // Optional, if passed from server
};

export function usePromptDetails({ prompt, initialIsFavorited = false, parsedVariableDefs }: UsePromptDetailsProps) {
    const { t } = useLanguage();
    const { data: session } = useSession();

    // State
    const [selectedVersionId, setSelectedVersionId] = useState<string>(
        prompt.currentVersionId || prompt.versions[0]?.id || ""
    );
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isFavLoading, setIsFavLoading] = useState(false);
    const [error, setError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [diffConfig, setDiffConfig] = useState<{ oldVersion: any, newVersion: any } | null>(null);

    // Derived State
    const selectedVersion = useMemo(() =>
        prompt.versions.find((v) => v.id === selectedVersionId) || prompt.versions[0],
        [prompt.versions, selectedVersionId]);

    // Variable Logic
    const variableDefs: VariableDef[] = useMemo(() => {
        if (parsedVariableDefs && parsedVariableDefs.length > 0) return parsedVariableDefs;

        // Fallback for when hook manages parsing (if not passed from server)
        // ideally, this logic is dead code if we refactor properly up the chain
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

        // Get list of attachment filenames to exclude
        const attachmentNames = new Set(
            (selectedVersion.attachments || []).map(a => {
                const parts = a.filePath.split('/');
                return parts[parts.length - 1]; // Basename
            })
        );

        // Filter out variables that match attachment names
        const filteredVars = detectedVars.filter(v => !attachmentNames.has(v));

        return Array.from(new Set([...filteredVars, ...variableDefs.map((v) => v.key)]));
    }, [selectedVersion?.content, selectedVersion?.attachments, variableDefs]);

    // Side Effects
    // Update selected version if prompt changes externally (e.g. fresh data)
    useEffect(() => {
        if (prompt.currentVersionId) {
            setSelectedVersionId(prompt.currentVersionId);
        }
    }, [prompt.currentVersionId]);

    const viewTracked = useRef(false);
    useEffect(() => {
        if (viewTracked.current) return;
        viewTracked.current = true;
        fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ promptId: prompt.id, type: "view" }),
        }).catch(err => console.error("Analytics error:", err));
    }, [prompt.id]);

    // Actions
    const handleToggleFavorite = async () => {
        if (!session?.user) {
            signIn();
            return;
        }

        if (isFavLoading) return;
        setIsFavLoading(true);
        const newState = !isFavorited;
        setIsFavorited(newState);
        try {
            await toggleFavorite(prompt.id);
        } catch (e) {
            console.error("Failed to toggle favorite:", e);
            setIsFavorited(!newState);
        } finally {
            setIsFavLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
    };

    const confirmDelete = async () => {
        try {
            await deletePrompt(prompt.id);
            const encodedTitle = encodeURIComponent(prompt.title);
            window.location.href = `/?deletedPrompt=${encodedTitle}`;
        } catch (e) {
            setError(t('detail.errors.deleteFailed'));
            console.error(e);
            setIsDeleting(false);
        }
    };

    const fillVariable = (key: string, value: string) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    };

    return {
        selectedVersionId,
        setSelectedVersionId,
        selectedVersion,
        variables,
        fillVariable,
        isFavorited,
        isFavLoading,
        handleToggleFavorite,
        isDeleting,
        setIsDeleting,
        handleDelete,
        confirmDelete,
        error,
        diffConfig,
        setDiffConfig,
        variableDefs,
        uniqueVars
    };
}
