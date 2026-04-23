"use client";

import { useState, useTransition } from "react";
import { createPrompt } from "@/actions/prompt-crud";
import { CollectionWithPrompts, TagWithCount } from "@/types/prisma";
import UnifiedPromptForm from "@/components/UnifiedPromptForm";
import { useLanguage } from "./LanguageProvider";
export default function CreatePromptForm({ 
    collections, 
    tags, 
    agentSkills, 
    initialCollectionId, 
    tagColorsEnabled, 
    privatePromptsEnabled = false 
}: { 
    collections: CollectionWithPrompts[], 
    tags: TagWithCount[], 
    agentSkills?: any[], 
    initialCollectionId?: string, 
    tagColorsEnabled?: boolean, 
    privatePromptsEnabled?: boolean 
}) {
    const { t } = useLanguage();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setError("");
        startTransition(async () => {
            try {
                await createPrompt(formData);
            } catch (err: unknown) {
                if (err instanceof Error && (err.message === 'NEXT_REDIRECT' || err.message?.includes('NEXT_REDIRECT'))) {
                    throw err;
                }
                const message = err instanceof Error ? err.message : "An unexpected error occurred.";
                console.error("CreatePrompt Error:", message);
                setError(message);
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
        collections: initialCollectionId ? [{ id: initialCollectionId, title: "Initial" }] : []
    };

    return (
        <UnifiedPromptForm
            mode="CREATE"
            initialValues={initialValues}
            collections={collections}
            tags={tags}
            agentSkills={agentSkills}
            tagColorsEnabled={tagColorsEnabled}
            privatePromptsEnabled={privatePromptsEnabled}
            onSubmit={handleSubmit}
            isPending={isPending}
            serverError={error === "Failed to create prompt. Please try again." ? t('form.errors.createFailed') : error}
        />
    );
}
