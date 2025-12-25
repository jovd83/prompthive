
import { prisma } from '../lib/prisma';
import { toggleFavoriteService } from '../services/favorites';

async function testFavorite() {
    try {
        // 1. Get a user
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found");
            return;
        }
        console.log("Found user:", user.id, user.email);

        // 2. Get a prompt
        const prompt = await prisma.prompt.findFirst();
        if (!prompt) {
            console.log("No prompts found");
            return;
        }
        console.log("Found prompt:", prompt.id, prompt.title);

        // 3. Toggle
        console.log("Toggling favorite...");
        const result1 = await toggleFavoriteService(user.id, prompt.id);
        console.log("Result 1:", result1);

        // 4. Toggle back
        console.log("Toggling back...");
        const result2 = await toggleFavoriteService(user.id, prompt.id);
        console.log("Result 2:", result2);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

testFavorite();
