
import { prisma } from "../lib/prisma";
import { getExportData } from "../actions/export";
import { importUnifiedService } from "../services/imports";

async function testFullCycle() {
    console.log("--- Testing Full Cycle Export/Import ---");
    
    const user = await prisma.user.findFirst({ where: { username: "Jochim" } });
    if (!user) return;

    // 1. Create a Skill and a Prompt that uses it
    console.log("Step 1: Creating test data...");
    const skill = await prisma.prompt.create({
        data: {
          title: "Test Skill",
          itemType: "AGENT_SKILL",
          createdById: user.id,
          versions: { create: { content: "Skill Content", versionNumber: 1, createdById: user.id } }
        },
        include: { versions: true }
    });

    const runner = await prisma.prompt.create({
        data: {
          title: "Test Runner",
          createdById: user.id,
          versions: { 
            create: { 
              content: "Runner Content", 
              versionNumber: 1,
              createdById: user.id,
              agentSkillIds: JSON.stringify([skill.id])
            } 
          }
        },
        include: { versions: true }
    });

    console.log(`Created skill: ${skill.id}, Runner: ${runner.id}`);

    // 2. Export (Manual simulate standard export)
    console.log("Step 2: Exporting...");
    const exportData = await prisma.prompt.findMany({
        where: { id: { in: [skill.id, runner.id] } },
        include: {
            tags: true,
            versions: { include: { attachments: true }, orderBy: { versionNumber: "desc" } },
            collections: true
        }
    });
    
    const exportJson = exportData.map(p => ({
        ...p,
        versions: p.versions.map(v => ({
            ...v,
            agentUsage: v.agentUsage ?? "",
            agentSkillIds: v.agentSkillIds ?? "[]"
        }))
    }));
    
    // 3. Clean up
    await prisma.prompt.deleteMany({ where: { id: { in: [skill.id, runner.id] } } });
    console.log("Cleaned up source prompts.");

    // 4. Import
    console.log("Step 4: Importing...");
    const importResult = await importUnifiedService(user.id, exportJson);
    console.log(`Import Result: ${JSON.stringify(importResult)}`);

    // 5. Verify remapping
    const importedRunner = await prisma.prompt.findFirst({
        where: { title: "Test Runner", createdById: user.id },
        include: { versions: true }
    });

    if (!importedRunner) {
        console.error("Runner not found after import");
    } else {
        const v = importedRunner.versions[0];
        console.log(`Imported Runner Version: ${v.agentSkillIds}`);
        const newSkillIds = JSON.parse(v.agentSkillIds || "[]");
        if (newSkillIds.length > 0) {
            const newSkillId = newSkillIds[0];
            const skillExists = await prisma.prompt.findUnique({ where: { id: newSkillId } });
            console.log(`Skill Link Verified: ${!!skillExists} (New ID: ${newSkillId})`);
            if (skillExists) console.log(`  Skill Title: ${skillExists.title}`);
        } else {
            console.error("FAIL: No skill IDs found in imported runner version!");
        }
    }

    // Final Cleanup
    await prisma.prompt.deleteMany({ where: { title: { in: ["Test Skill", "Test Runner"] }, createdById: user.id } });
}

testFullCycle().catch(console.error);
