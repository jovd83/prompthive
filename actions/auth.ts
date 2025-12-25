"use server";

import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendWelcomeEmail } from "@/services/email";

export async function registerUser(username: string, email: string, password: string) {
    if (!username || !email || !password) throw new Error("Missing required fields");

    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
        if (existingUser.email === email) throw new Error("Email already registered");
        if (existingUser.username === username) throw new Error("Username already taken");
    }

    // Check if registration is enabled globally
    const globalSettings = await prisma.globalConfiguration.findUnique({
        where: { id: "GLOBAL" }
    });

    if (globalSettings && !globalSettings.registrationEnabled) {
        throw new Error("Registration is currently disabled by the administrator.");
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
        data: { username, email, passwordHash, role: "USER" }
    });

    // Fire and forget email
    sendWelcomeEmail(email).catch(err => console.error("Failed to send welcome email:", err));
}
