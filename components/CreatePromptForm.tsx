"use client";

import { useState, useTransition } from "react";
import { createPrompt } from "@/actions/prompts";
import { Collection, Tag } from "@prisma/client";
import UnifiedPromptForm from "@/components/UnifiedPromptForm";
import { useLanguage } from "./LanguageProvider";

export default function CreatePromptForm({
    collections,
    tags,
    initialCollectionId,
    tagColorsEnabled = true,
    privatePromptsEnabled = false
}: {
    collections: (Collection & { _count?: { prompts: number } })[],
    tags: Tag[],
    initialCollectionId?: string,
    tagColorsEnabled?: boolean;
    privatePromptsEnabled?: boolean;
}) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                await createPrompt(formData);
            } catch (err: any) {
                if (err.message === 'NEXT_REDIRECT' || err.message?.includes('NEXT_REDIRECT') || err.digest?.includes('NEXT_REDIRECT')) {
                    throw err;
                }
                console.error("CreatePrompt Error:", err);
                setError(err.message || "An unexpected error occurred.");
            }
        });
    };

    // Prepare proper types for UnifiedPromptForm
    // Note: UnifiedForm expects CollectionWithPrompts (from Prisma types), but here we might have slightly different shapes.
    // However, the dropdown just needs id and title and totalPrompts.
    // We can cast as any for the collections prop if types are strict, or map it.
    // The collection prop in UnifiedForm is: collections?: CollectionWithPrompts[];

    // Construct initial values object
    const initialValues = {
        collections: initialCollectionId ? [{ id: initialCollectionId } as any] : []
    };

    return (
        <UnifiedPromptForm
            mode="CREATE"
            initialValues={initialValues}
            collections={collections as any}
            tags={tags as any}
            tagColorsEnabled={tagColorsEnabled}
            privatePromptsEnabled={privatePromptsEnabled}
            onSubmit={handleSubmit}
            isPending={isPending}
            serverError={error === "Failed to create prompt. Please try again." ? t('form.errors.createFailed') : error}
        />
    );
}
