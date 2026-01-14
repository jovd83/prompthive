import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ROLES } from "@/lib/permissions";

// 1 Hour Expiry
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000;

export async function updateAvatarService(userId: string, avatarUrl: string) {
    return prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
    });
}

export async function changePasswordService(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const isValid = await compare(oldPassword, user.passwordHash);
    if (!isValid) throw new Error("Incorrect current password");

    const passwordHash = await hash(newPassword, 12);
    return prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
}

export async function generateResetTokenService(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null; // Silently fail for security

    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY);

    await prisma.user.update({
        where: { email },
        data: { resetToken, resetTokenExpires },
    });

    return resetToken;
}

export async function resetPasswordService(token: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { resetToken: token } });

    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
        throw new Error("Invalid or expired reset token");
    }

    const passwordHash = await hash(newPassword, 12);

    return prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            resetToken: null,
            resetTokenExpires: null,
        }
    });
}

export async function updateLanguageService(userId: string, language: string) {
    // Validate language
    if (!['en', 'nl', 'fr'].includes(language)) {
        throw new Error("Invalid language");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { language },
    });
}

export async function updateUserRoleService(userId: string, role: string) {
    if (![ROLES.USER, ROLES.ADMIN, ROLES.GUEST].includes(role as any)) {
        throw new Error("Invalid role");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { role },
    });
}

export async function createUserService(data: { username: string; email: string; passwordHash: string; role: string }) {
    // Validate role
    if (![ROLES.USER, ROLES.ADMIN, ROLES.GUEST].includes(data.role as any)) {
        throw new Error("Invalid role");
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { username: data.username }
            ]
        }
    });

    if (existingUser) {
        throw new Error("User with this email or username already exists");
    }

    return prisma.user.create({
        data: {
            username: data.username,
            email: data.email,
            passwordHash: data.passwordHash,
            role: data.role,
        }
    });
}

export async function getAllUsersService() {
    return prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true,
            avatarUrl: true
        }
    });
}

export async function deleteUserService(userId: string, transferToUserId: string) {
    // Perform manual cascade delete in a transaction to avoid FK violations
    // AND Reassign content to the admin to preserve it.
    return prisma.$transaction(async (tx) => {
        // 1. Reassign Content (Prompts, Collections, Workflows, Versions)

        // Prompts
        await tx.prompt.updateMany({
            where: { createdById: userId },
            data: { createdById: transferToUserId }
        });

        // Prompt Versions
        await tx.promptVersion.updateMany({
            where: { createdById: userId },
            data: { createdById: transferToUserId }
        });

        // Collections
        await tx.collection.updateMany({
            where: { ownerId: userId },
            data: { ownerId: transferToUserId }
        });

        // Workflows
        await tx.workflow.updateMany({
            where: { ownerId: userId },
            data: { ownerId: transferToUserId }
        });

        // 2. Delete Personal Data (Settings, Favorites)
        await tx.settings.deleteMany({ where: { userId } });
        await tx.favorite.deleteMany({ where: { userId } });

        // 3. Finally delete User (using deleteMany for idempotency to avoid "Record to delete does not exist" errors)
        return tx.user.deleteMany({ where: { id: userId } });
    });
}