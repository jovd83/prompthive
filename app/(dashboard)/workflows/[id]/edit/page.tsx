import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import * as WorkflowService from "@/services/workflows";
import * as PromptsService from "@/services/prompts";
import WorkflowEditor from "@/components/WorkflowEditor";

// Next.js 15 uses params as Promise
type Props = {
    params: Promise<{ id: string }>;
};

export default async function EditWorkflowPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) redirect("/login");

    const resolvedParams = await params;
    const workflow = await WorkflowService.getWorkflow(session.user.id, resolvedParams.id);
    if (!workflow) notFound();

    const allPrompts = await PromptsService.getAllPromptsSimple(session.user.id);

    return <WorkflowEditor workflow={workflow} allPrompts={allPrompts} />;
}
