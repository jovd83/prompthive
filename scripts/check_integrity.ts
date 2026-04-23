
import { prisma } from "../lib/prisma";

async function checkIntegrity() {
    console.log("--- Agent Skills Integrity Check ---");
    const versions = await prisma.promptVersion.findMany({
        where: { agentSkillIds: { not: null, not: "" } },
        select: { id: true, agentSkillIds: true, promptId: true, versionNumber: true }
    });

    console.log(`Checking ${versions.length} versions...`);
    let brokenCount = 0;

    for (const v of versions) {
        try {
            const ids = JSON.parse(v.agentSkillIds!);
            if (Array.isArray(ids)) {
                for (const id of ids) {
                    const skill = await prisma.prompt.findUnique({ where: { id } });
                    if (!skill) {
                        console.log(`[Broken] Version ${v.id} (Prompt ${v.promptId} V${v.versionNumber}) refers to missing Skill ID: ${id}`);
                        brokenCount++;
                    }
                }
            }
        } catch (e) {
            console.log(`[Malformed] Version ${v.id}: ${v.agentSkillIds}`);
        }
    }

    console.log(`Integrity Check Finished. Broken links: ${brokenCount}`);
}

checkIntegrity();
