
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateZeroExport } from "@/services/export-service";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { collectionIds } = body;

        if (!Array.isArray(collectionIds) || collectionIds.length === 0) {
            return NextResponse.json({ error: "No collections selected" }, { status: 400 });
        }

        const exportData = await generateZeroExport(session.user.id, collectionIds);

        return NextResponse.json(exportData);

    } catch (error: any) {
        console.error("Export Zero Error:", error);
        return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
    }
}
