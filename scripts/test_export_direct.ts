
import { prisma } from "../lib/prisma";

async function testExportLogicDirectly() {
    console.log("--- Testing Recursive Export Logic Directly ---");
    const userId = 'cmo15q65j0006389o874mad4b'; // Jochim

    // 1. Initial set
    const prompts = await prisma.prompt.findMany({
        where: { createdById: userId, title: "defect-lifecycle-agent-skill" },
        select: { id: true }
    });
    
    if (prompts.length === 0) {
        console.log("No defect-lifecycle-agent-skill found. Please import it first.");
        return;
    }

    const allPromptIds = new Set(prompts.map(p => p.id));
    console.log(`Initial ID: ${Array.from(allPromptIds)[0]}`);

    // 2. Recursive Loop
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 10) {
        changed = false;
        iterations++;
        const currentPromptIds = Array.from(allPromptIds);
        console.log(`Iteration ${iterations}: Processing ${currentPromptIds.length} prompts...`);
        
        const versions = await prisma.promptVersion.findMany({
            where: { promptId: { in: currentPromptIds } },
            select: { agentSkillIds: true, promptId: true }
        });

        for (const v of versions) {
            if (v.agentSkillIds) {
                try {
                    const skillIds = JSON.parse(v.agentSkillIds);
                    if (Array.isArray(skillIds)) {
                        for (const sid of skillIds) {
                            if (!allPromptIds.has(sid)) {
                                console.log(`  Adding dependency: ${sid}`);
                                allPromptIds.add(sid);
                                changed = true;
                            }
                        }
                    }
                } catch (e) {}
            }
        }
    }

    console.log(`Total IDs found: ${allPromptIds.size}`);
    
    // 3. Verify if they exist in DB
    const finalPrompts = await prisma.prompt.findMany({
        where: { id: { in: Array.from(allPromptIds) } },
        select: { id: true, title: true }
    });
    
    console.log(`Final Prompts in DB: ${finalPrompts.length}`);
    finalPrompts.forEach(p => console.log(`  - ${p.title} (${p.id})`));
}

testExportLogicDirectly().catch(console.error);
