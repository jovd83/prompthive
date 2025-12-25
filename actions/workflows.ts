"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as WorkflowService from "@/services/workflows";

export async function createWorkflowAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const stepsJson = (formData.get("steps") as string) || "[]";

    let steps = [];
    try {
        steps = stepsJson ? JSON.parse(stepsJson) : [];
    } catch {
        steps = [];
    }

    const wf = await WorkflowService.createWorkflow(session.user.id, title, description, steps);
    revalidatePath("/workflows");
    redirect(`/workflows/${wf.id}/edit`);
}

export async function updateWorkflowAction(workflowId: string, formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const title = (formData.get("title") as string) || "";
    const description = (formData.get("description") as string) || "";
    const stepsJson = (formData.get("steps") as string) || "[]";

    let steps = [];
    try {
        steps = JSON.parse(stepsJson);
    } catch {
        steps = [];
    }

    await WorkflowService.updateWorkflow(session.user.id, workflowId, title, description, steps);
    revalidatePath("/workflows");
    revalidatePath(`/workflows/${workflowId}`);
}

export async function deleteWorkflowAction(workflowId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await WorkflowService.deleteWorkflow(session.user.id, workflowId);
    revalidatePath("/workflows");
}
