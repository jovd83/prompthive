"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { sendWelcomeEmail } from "@/services/email";
import { User } from "@prisma/client";

export async function getGlobalSettings() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    let settings = await prisma.globalConfiguration.findUnique({
        where: { id: "GLOBAL" },
    });

    if (!settings) {
        settings = await prisma.globalConfiguration.create({
            data: {
                id: "GLOBAL",
                registrationEnabled: true,
            },
        });
    }

    return settings;
}

export async function updateGlobalSettings(data: { registrationEnabled?: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.globalConfiguration.upsert({
        where: { id: "GLOBAL" },
        update: data,
        create: {
            id: "GLOBAL",
            ...data,
        },
    });


    revalidatePath("/settings");
    revalidatePath("/register");
}

export async function getUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            avatarUrl: true,
            createdAt: true
        }
    });
}

export async function createUser(data: { username: string; email: string; password: string; role?: string }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    const { username, email, password, role = "USER" } = data;

    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });

    if (existing) {
        throw new Error("User with this email or username already exists");
    }

    const passwordHash = await hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            role
        }
    });

    sendWelcomeEmail(email).catch(console.error);
    revalidatePath("/settings");
    return newUser;
}

export async function updateUserRole(userId: string, role: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role }
    });

    revalidatePath("/settings");
}
