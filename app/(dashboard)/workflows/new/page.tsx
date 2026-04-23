"use client";

import { createWorkflowAction } from "@/actions/workflows";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" className="btn btn-primary" disabled={pending}>
            {pending ? "Creating..." : "Create Workflow"}
        </button>
    );
}

export default function NewWorkflowPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/workflows" className="btn btn-ghost btn-sm btn-square">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold">New Workflow</h1>
            </div>

            <form action={createWorkflowAction} className="space-y-6 bg-surface p-6 rounded-lg border border-border">
                <div className="form-control">
                    <label className="label font-medium">Title</label>
                    <input name="title" type="text" className="input input-bordered" placeholder="e.g. SEO Article Generator" required />
                </div>

                <div className="form-control">
                    <label className="label font-medium">Description</label>
                    <textarea name="description" className="textarea textarea-bordered h-32 w-full border border-border" placeholder="What does this workflow do?"></textarea>
                </div>

                {/* Hidden steps input for now (empty) */}
                <input type="hidden" name="steps" value="[]" />

                <div className="flex justify-end gap-2">
                    <Link href="/workflows" className="btn btn-ghost">Cancel</Link>
                    <SubmitButton />
                </div>
            </form>
        </div>
    );
}
