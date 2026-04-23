
import { prisma } from "../lib/prisma";
import { importUnifiedService } from "../services/imports";
import fs from "fs";

async function testImport() {
    console.log("--- Testing Import Logic ---");
    
    const filePath = "C:\\Downloads\\TMT-backup-2026-04-20 (2).json";
    if (!fs.existsSync(filePath)) {
        console.error("Backup file not found!");
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const user = await prisma.user.findFirst({ where: { username: "Jochim" } });
    if (!user) {
        console.error("User 'Jochim' not found");
        return;
    }

    // Clean up
    const titles = data.prompts.map((p: any) => p.title);
    await prisma.prompt.deleteMany({ where: { title: { in: titles }, createdById: user.id } });
    console.log("Cleaned up existing prompts.");

    // Import
    const result = await importUnifiedService(user.id, data);
    console.log(`Import count: ${result.count}`);

    // Verify links for a known prompt
    const targetTitle = "defect-lifecycle-agent-skill";
    const prompt = await prisma.prompt.findFirst({
        where: { title: targetTitle, createdById: user.id },
        include: { versions: { orderBy: { versionNumber: "desc" } } }
    });

    if (!prompt) {
        console.error(`Prompt '${targetTitle}' not found after import`);
        return;
    }

    for (const v of prompt.versions) {
        if (v.agentSkillIds && v.agentSkillIds !== "[]") {
            const skillIds = JSON.parse(v.agentSkillIds);
            console.log(`Version ${v.versionNumber} has ${skillIds.length} skills.`);
            
            // Check if these IDs exist in DB
            const existingSkills = await prisma.prompt.findMany({
                where: { id: { in: skillIds } },
                select: { id: true, title: true }
            });
            console.log(`  Found in DB: ${existingSkills.length}/${skillIds.length}`);
            existingSkills.forEach(s => console.log(`    - ${s.title} (${s.id})`));
        } else {
            console.log(`Version ${v.versionNumber} has no skills (JSON: ${v.agentSkillIds}).`);
        }
    }
}

testImport().catch(console.error);
