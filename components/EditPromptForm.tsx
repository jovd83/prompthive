"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createVersion } from "@/actions/prompt-crud";
import { CollectionWithPrompts, PromptWithRelations, TagWithCount, PromptVersionWithRelations } from "@/types/prisma";
import UnifiedPromptForm from "@/components/UnifiedPromptForm";
import { useLanguage } from "./LanguageProvider";

interface EditPromptFormProps {
    prompt: PromptWithRelations;
    latestVersion: PromptVersionWithRelations;
    collections?: CollectionWithPrompts[];
    tags?: TagWithCount[];
    tagColorsEnabled?: boolean;
    privatePromptsEnabled?: boolean;
}

export default function EditPromptForm({ prompt, latestVersion, collections = [], tags = [], tagColorsEnabled = true, privatePromptsEnabled = false }: EditPromptFormProps) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (formData: FormData) => {
        setError(null);
        startTransition(async () => {
            try {
                await createVersion(formData);
            } catch (error: unknown) {
                if (error instanceof Error && error.message === "NEXT_REDIRECT") {
                    throw error;
                }
                const message = error instanceof Error ? error.message : "Failed to create version. Please try again.";
                console.error("Submission failed:", message);
                setError(message);
            }
        });
    };

    // Prepare initial values
    const initialValues = {
        ...prompt,
        variableDefinitions: latestVersion.variableDefinitions,
        // Helper for hook to find attachment data
        versions: [latestVersion],
        // Direct content mapping (UnifiedForm handles both)
        content: latestVersion.content,
        shortContent: latestVersion.shortContent,
    };

    return (
        <UnifiedPromptForm
            mode="EDIT"
            initialValues={initialValues}
            collections={collections}
            tags={tags}
            tagColorsEnabled={tagColorsEnabled}
            privatePromptsEnabled={privatePromptsEnabled}
            onSubmit={handleSubmit}
            isPending={isPending}
            serverError={error === "Failed to create version. Please try again." ? t('form.errors.createVersionFailed') : error}
            cancelHref={`/prompts/${prompt.id}`}
        />
    );
}
