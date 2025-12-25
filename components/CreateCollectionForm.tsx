"use client";

import { ActionState, createCollection } from "@/actions/collections";
import { AlertCircle, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useLanguage } from "./LanguageProvider";

// Initial state must match ActionState
const initialState: ActionState = { message: "", errors: {} };

export default function CreateCollectionForm({
    collections
}: {
    collections: { id: string, title: string }[]
}) {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const parentIdParam = searchParams.get("parentId");

    // Type assertion for useFormState if necessary, or just rely on inference
    const [state, formAction] = useFormState(createCollection, initialState);

    return (
        <form action={formAction} className="card space-y-4">
            {state.message && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-4 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} /> {state.message}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">{t('collections.parent')}</label>
                <select name="parentId" className="input" defaultValue={parentIdParam || ""}>
                    <option value="">{t('collections.root')}</option>
                    {collections.map((col) => (
                        <option key={col.id} value={col.id}>{col.title}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('collections.labelTitle')}</label>
                <input name="title" type="text" className="input" required placeholder={t('collections.placeholderTitle')} data-lpignore="true" />
                {state.errors?.title && <p className="text-xs text-red-500 mt-1">{state.errors.title[0]}</p>}
            </div>
            <div>
                <label className="block text-sm font-medium mb-1">{t('collections.description')}</label>
                <textarea name="description" className="input h-24 resize-y" placeholder={t('collections.placeholderDesc')} data-lpignore="true" />
            </div>
            <div className="flex justify-end pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}

function SubmitButton() {
    const { t } = useLanguage();
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
            {pending ? <><Loader2 className="animate-spin mr-2" size={16} /> {t('collections.creating')}</> : t('collections.createButton')}
        </button>
    );
}
