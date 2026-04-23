
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('Verifying refined migration results...');

    const root = await prisma.collection.findFirst({
        where: { title: 'Software testing - scraped' },
        include: { prompts: true, children: true }
    });

    if (!root) {
        console.error('Root collection not found!');
        return;
    }
    console.log(`Root collection found: ${root.title} (${root.id})`);

    // Check for "Deep Research Tooling Landscape" (was deep_research_tooling_landscape)
    // The collection structure might have it nested:
    // 1) test planning & management -> deep_research_tooling_landscape -> deep_research_tooling_landscape.md
    // Based on logic: Directories are collections or prompts. 
    // "deep_research_tooling_landscape" folder -> Collection "Deep Research Tooling Landscape"
    // "deep_research_tooling_landscape.md" -> Prompt inside it?
    // Wait, if "deep_research_tooling_landscape" contains only the md file, it becomes a PROMPT.
    // Let's check for the Prompt directly.

    const promptName = 'Deep Research Tooling Landscape';
    const prompt = await prisma.prompt.findFirst({
        where: { title: promptName }, // Humanized title
        include: {
            versions: { include: { attachments: true } },
            tags: true,
            collections: true
        }
    });

    if (prompt) {
        console.log(`\nFound Prompt: ${prompt.title}`);
        console.log(`Description: ${prompt.description ? prompt.description.substring(0, 200) + '...' : 'NULL'}`);
        console.log(`Tags: ${prompt.tags.map(t => t.name).join(', ')}`);

        const v1 = prompt.versions[0];
        console.log(`Version 1 Content Length: ${v1.content.length}`);

    } else {
        console.log(`Prompt '${promptName}' not found! Trying original name?`);
        // Debug fallback
        const oldPrompt = await prisma.prompt.findFirst({
            where: { title: 'deep_research_tooling_landscape' }
        });
        if (oldPrompt) console.log("Found OLD name prompt - Migration failed to rename?");
    }

    // List all tags created
    const tags = await prisma.tag.findMany({ take: 20 });
    console.log('\nSample Tags:');
    tags.forEach(t => console.group(`- ${t.name}`));
}

check()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
