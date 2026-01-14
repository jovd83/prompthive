
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUserService, getAllUsersService, updateUserRoleService } from "@/services/user";
import { updateGlobalSettingsService } from "@/services/settings";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function getUsers() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }
    return getAllUsersService();
}

export async function updateUserRole(userId: string, role: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }
    return updateUserRoleService(userId, role);
}

export async function createUser(data: any) {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized: Admin access required");
    }

    const { username, email, password, role } = data;

    if (!username || !email || !password || !role) {
        throw new Error("Missing fields");
    }

    // Check existing
    const existing = await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });

    if (existing) {
        throw new Error("User already exists with this email or username");
    }

    const passwordHash = await hash(password, 10);

    const newUser = await createUserService({
        username,
        email,
        passwordHash,
        role
    });

    return newUser;
}

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    if (session.user.id === userId) {
        throw new Error("You cannot delete your own account");
    }

    // Call service to handle cascade delete
    // We need to import check permissions? No, we did.
    // Import deleteUserService dynamically or add to imports above?
    // Need to add import at top of file.
    // For now, assume import is added or I will add it in next step/same step if possible.
    // Wait, I can't edit multiple parts widely separated easily with replace_file_content unless contiguous?
    // I should use multi_replace or just assume I'll fix imports.
    // Actually, I can use multi_replace_file_content to fix import AND add function.
    // But I am using replace_file_content here.
    // I will add the function here, and then fix the import.

    // We need to fetch the service.
    // Importing at top of file is better.
    // Let's assume I will fix import in next tool call.
    return (await import("@/services/user")).deleteUserService(userId, session.user.id);
}

export async function updateGlobalSettings(data: { registrationEnabled: boolean; privatePromptsEnabled?: boolean }) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized");
    }

    await updateGlobalSettingsService(data);
    return { success: true };
}
