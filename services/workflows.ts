import { prisma } from "@/lib/prisma";

export type WorkflowStepInput = {
    promptId: string;
    order: number;
    inputMappings: Record<string, string>; // { varName: "stepId:output" | "USER_INPUT" }
};

export async function createWorkflow(userId: string, title: string, description: string | undefined, steps: WorkflowStepInput[]) {
    return prisma.workflow.create({
        data: {
            ownerId: userId,
            title,
            description,
            steps: {
                create: steps.map(s => ({
                    promptId: s.promptId,
                    order: s.order,
                    inputMappings: JSON.stringify(s.inputMappings)
                }))
            }
        },
        include: { steps: true }
    });
}

export async function updateWorkflow(userId: string, workflowId: string, title: string, description: string | undefined, steps: WorkflowStepInput[]) {
    return prisma.$transaction(async (tx) => {
        const wf = await tx.workflow.findUnique({ where: { id: workflowId } });
        if (!wf || wf.ownerId !== userId) throw new Error("Workflow not found or unauthorized");

        await tx.workflow.update({
            where: { id: workflowId },
            data: { title, description }
        });

        await tx.workflowStep.deleteMany({ where: { workflowId } });

        for (const step of steps) {
            await tx.workflowStep.create({
                data: {
                    workflowId,
                    promptId: step.promptId,
                    order: step.order,
                    inputMappings: JSON.stringify(step.inputMappings)
                }
            });
        }

        return tx.workflow.findUnique({ where: { id: workflowId }, include: { steps: true } });
    });
}

export async function deleteWorkflow(userId: string, workflowId: string) {
    const wf = await prisma.workflow.findUnique({ where: { id: workflowId } });
    if (!wf || wf.ownerId !== userId) throw new Error("Unauthorized");
    return prisma.workflow.delete({ where: { id: workflowId } });
}

export async function getWorkflow(userId: string, workflowId: string) {
    const wf = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
            steps: {
                include: {
                    prompt: {
                        include: {
                            versions: {
                                orderBy: { versionNumber: 'desc' },
                                take: 1
                            }
                        }
                    }
                },
                orderBy: { order: 'asc' }
            }
        }
    });
    if (!wf || wf.ownerId !== userId) return null;
    return wf;
}

export async function listWorkflows(userId: string) {
    return prisma.workflow.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
        include: {
            _count: { select: { steps: true } }
        }
    });
}
