import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import * as WorkflowService from "@/services/workflows";
import WorkflowsView from "@/components/WorkflowsView";

export default async function WorkflowsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const workflows = await WorkflowService.listWorkflows(session.user.id);

    return (
        <WorkflowsView workflows={workflows} />
    );
}
