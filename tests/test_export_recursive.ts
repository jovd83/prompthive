
// Mock next-auth to avoid request scope error
jest.mock('next-auth/next', () => ({
    getServerSession: jest.fn().mockImplementation(() => Promise.resolve({
        user: { id: 'cmo15q65j0006389o874mad4b' } // Jochim's ID
    }))
}));

import { getExportMeta } from "../actions/export";
import { prisma } from "../lib/prisma";
import * as jest from 'jest-mock';

async function testExportRecursive() {
    console.log("--- Testing Recursive Export ---");
    
    const user = await prisma.user.findFirst({ where: { username: "Jochim" } });
    if (!user) return;

    // Find the prompt that has dependencies
    const prompt = await prisma.prompt.findFirst({
        where: { title: "defect-lifecycle-agent-skill", createdById: user.id }
    });

    if (!prompt) {
        console.error("Target prompt not found. Import it first.");
        return;
    }

    console.log(`Testing with Prompt: ${prompt.title} (${prompt.id})`);

    // Let's find what versions it has and their skill IDs
    const versions = await prisma.promptVersion.findMany({
        where: { promptId: prompt.id },
        select: { versionNumber: true, agentSkillIds: true }
    });
    
    versions.forEach(v => {
        console.log(`  Version ${v.versionNumber} has skill IDs: ${v.agentSkillIds}`);
    });

    // Run export meta
    const result = await getExportMeta(user.id, [], true); // recursive=true, but no collectionIds? 
    // Wait! if collectionIds is empty, it exports ALL.
    
    console.log(`Exported Prompt IDs: ${result.promptIds.length}`);
    
    // Check if any of the skill IDs are in the result
    versions.forEach(v => {
        if (v.agentSkillIds) {
            const ids = JSON.parse(v.agentSkillIds);
            ids.forEach((id: string) => {
                const found = result.promptIds.includes(id);
                console.log(`    ID ${id} in export? ${found}`);
            });
        }
    });
}

testExportRecursive().catch(console.error);
