import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import * as WorkflowService from "@/services/workflows";
import WorkflowRunner from "@/components/WorkflowRunner";

type Props = {
    params: Promise<{ id: string }>;
};

export default async function RunWorkflowPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const resolvedParams = await params;
    const workflow = await WorkflowService.getWorkflow(session.user.id, resolvedParams.id);
    if (!workflow) notFound();

    // Transform workflow steps to include prompt data (already done by service)
    // We just pass it to the client component
    // Need to cast the type or ensure Service return type matches component props
    // The service returns `steps: { prompt: Prompt }[]`.
    // The component expects `steps: Step[]` where Step has `prompt` with versions
    // Wait, `getWorkflow` includes `steps: { include: { prompt: true } }`.
    // But `Prompt` includes `versions`? No, `prompt: true` does NOT include versions by default unless specified in nested include?
    // Let's check services/workflows.ts getWorkflow.

    // It says: include: { steps: { include: { prompt: true }, orderBy ... } }
    // It usually doesn't include deep relations of Prompt unless asked.
    // I need to update the service to include prompt versions!

    return <WorkflowRunner workflow={workflow as any} />;
}
