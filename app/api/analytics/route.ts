import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { promptId, type } = await req.json();

    if (!promptId || !type) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

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

    return NextResponse.json({ success: true });
}
