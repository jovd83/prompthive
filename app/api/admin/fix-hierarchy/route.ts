
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    console.log("Starting prompt hierarchy debug...");

    const promptId = "cmjcitld9001ckyndk2slvc0e";
    const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        include: {
            collections: {
                include: {
                    parent: {
                        include: {
                            parent: true
                        }
                    }
                }
            }
        }
    });

    if (!prompt) {
        return NextResponse.json({ error: "Prompt not found" });
    }

    const debugInfo = prompt.collections.map((c: any) => {
        let path = c.title;
        let current: any = c.parent;
        while (current) {
            path = current.title + " -> " + path;
            current = current.parent;
        }
        return {
            id: c.id,
            title: c.title,
            parentId: c.parentId,
            hierarchy: path
        };
    });

    // Also check if there are other "Toys" collections
    const toysCollections = await prisma.collection.findMany({
        where: { title: "Toys" },
        include: { parent: true }
    });

    return NextResponse.json({
        promptId,
        assignedCollections: debugInfo,
        allToysCollections: toysCollections.map(t => ({ id: t.id, title: t.title, parent: t.parent?.title || "ROOT" }))
    });
}
