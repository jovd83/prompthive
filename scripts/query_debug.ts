
import { prisma } from "../lib/prisma";

async function queryDebug() {
    const v = await prisma.promptVersion.findUnique({
        where: { id: 'cmo7ifudg06pi38ekuvcwp572' },
        select: { agentSkillIds: true, promptId: true }
    });
    console.log("Raw agentSkillIds:", v?.agentSkillIds);
    
    if (v?.agentSkillIds) {
        const ids = JSON.parse(v.agentSkillIds);
        const skills = await prisma.prompt.findMany({
            where: { id: { in: ids } },
            select: { title: true, id: true }
        });
        console.log("Related skills found in DB:", skills.length);
        skills.forEach(s => console.log(`  - ${s.title} (${s.id})`));
    }
}

queryDebug();
