import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

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
    if (!['USER', 'ADMIN'].includes(role)) {
        throw new Error("Invalid role");
    }

    return prisma.user.update({
        where: { id: userId },
        data: { role },
    });
}