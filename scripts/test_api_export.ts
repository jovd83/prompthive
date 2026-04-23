
import { prisma } from "../lib/prisma";

async function testStreamedExportRecursion() {
    console.log("--- Testing Streamed Export Recursion ---");
    const userId = 'cmo15q65j0006389o874mad4b'; // Jochim
    
    // 1. Resolve IDs for a specific collection (or prompts)
    // We'll mimic the logic I just added to the API route
    const prompts = await prisma.prompt.findMany({
        where: { createdById: userId, title: "defect-lifecycle-agent-skill" },
        select: { id: true }
    });
    
    const allPromptIds = new Set(prompts.map(p => p.id));
    
    let changed = true;
    while (changed) {
        changed = false;
        const currentPromptIds = Array.from(allPromptIds);
        const versions = await prisma.promptVersion.findMany({
            where: { promptId: { in: currentPromptIds } },
            select: { agentSkillIds: true }
        });
        
        for (const v of versions) {
            if (v.agentSkillIds) {
                const ids = JSON.parse(v.agentSkillIds);
                if (Array.isArray(ids)) {
                    for (const sid of ids) {
                        if (!allPromptIds.has(sid)) {
                            console.log(`  Added skill: ${sid}`);
                            allPromptIds.add(sid);
                            changed = true;
                        }
                    }
                }
            }
        }
    }
    
    console.log(`Total IDs to export: ${allPromptIds.size}`);
    
    // 2. Fetch those IDs
    const exportItems = await prisma.prompt.findMany({
        where: { id: { in: Array.from(allPromptIds) } },
        select: { title: true }
    });
    
    console.log("Exported Titles:");
    exportItems.forEach(p => console.log(`  - ${p.title}`));
}

testStreamedExportRecursion().catch(console.error);
