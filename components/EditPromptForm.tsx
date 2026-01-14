"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createVersion } from "@/actions/prompts";
import { CollectionWithPrompts, PromptWithRelations, TagWithCount } from "@/types/prisma";
import UnifiedPromptForm from "@/components/UnifiedPromptForm";
import { useLanguage } from "./LanguageProvider";

interface EditPromptFormProps {
    prompt: PromptWithRelations;
    latestVersion: any; // Ideally this should be PromptVersion
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
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT") {
                    throw error;
                }
                console.error("Submission failed:", error);
                setError(error.message || "Failed to create version. Please try again.");
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
            initialValues={initialValues as any}
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
