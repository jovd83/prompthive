import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role === 'GUEST') {
            return NextResponse.json({ error: "Forbidden: Guests cannot import skills" }, { status: 403 });
        }

        const body = await req.json();
        const { repoUrl } = body;

        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }

        // Parse github url
        const match = repoUrl.match(/^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/);
        if (!match) {
            return NextResponse.json({ error: "Invalid GitHub repository URL" }, { status: 400 });
        }

        const owner = match[1];
        const repo = match[2];

        // Fetch repo info
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: {
                "User-Agent": "PromptHive"
            }
        });

        if (!repoRes.ok) {
            return NextResponse.json({ error: "Failed to fetch repository information" }, { status: 400 });
        }

        const repoData = await repoRes.json();
        
        const installCommand = `npx skills add ${owner}/${repo}`;

        return NextResponse.json({
            title: repoData.name,
            description: repoData.description || "",
            repoUrl: repoUrl,
            installCommand: installCommand,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to parse repository URL" }, { status: 500 });
    }
}
