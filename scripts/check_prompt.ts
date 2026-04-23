
import { prisma } from "../lib/prisma";

async function checkPrompt() {
    const id = "cmo8a5v4k0cnq38ekv1ks3y0m";
    const prompt = await prisma.prompt.findUnique({
        where: { id },
        include: { versions: { orderBy: { versionNumber: "desc" } } }
    });

    if (!prompt) {
        console.log("Prompt not found!");
        return;
    }

    console.log(`Prompt: ${prompt.title}`);
    for (const v of prompt.versions) {
        console.log(`V${v.versionNumber} (${v.id}) - agentSkillIds: ${v.agentSkillIds}`);
        if (v.agentSkillIds) {
            try {
                const ids = JSON.parse(v.agentSkillIds);
                for (const sid of ids) {
                    const skill = await prisma.prompt.findUnique({ where: { id: sid } });
                    console.log(`  -> Skill ${sid}: ${skill?.title || "NOT FOUND"}`);
                }
            } catch(e) {
                console.log(`  -> FAILED TO PARSE: ${v.agentSkillIds}`);
            }
        }
    }
}

checkPrompt();
