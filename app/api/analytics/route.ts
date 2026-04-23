import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    const { promptId, type } = await req.json();

    if (!promptId || !type) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    if (type === "view") {
        await prisma.prompt.update({
            where: { id: promptId },
            data: { viewCount: { increment: 1 } },
        });
    } else if (type === "copy") {
        await prisma.prompt.update({
            where: { id: promptId },
            data: { copyCount: { increment: 1 } },
        });
    }

    if (session?.user?.id) {
        await prisma.userPromptInteraction.upsert({
            where: {
                userId_promptId: {
                    userId: session.user.id,
                    promptId: promptId,
                }
            },
            create: {
                userId: session.user.id,
                promptId: promptId,
                type: type.toUpperCase(),
            },
            update: {
                type: type.toUpperCase(),
                updatedAt: new Date()
            }
        });
    }

    return NextResponse.json({ success: true });
}
