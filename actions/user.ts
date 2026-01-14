"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as UserService from "@/services/user";
import { uploadFile } from "@/services/files";
import { sendPasswordResetEmail } from "@/services/email";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export type ActionState = {
    success?: string;
    error?: string;
};

export async function updateAvatar(formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const file = formData.get("avatar") as File;
    if (!file) throw new Error("No file provided");

    const { filePath } = await uploadFile(file, "avatar-");
    await UserService.updateAvatarService(session.user.id, filePath);

    revalidatePath("/");
    return { success: "Avatar updated successfully" };
}

export async function changePassword(prevState: any, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;

    try {
        await UserService.changePasswordService(session.user.id, currentPassword, newPassword);
        return { success: "Password updated successfully" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function requestPasswordReset(prevState: any, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;

    // Get origin for link generation
    const headersList = await headers();
    const origin = headersList.get('origin') || process.env.NEXTAUTH_URL || "http://localhost:3000";

    const token = await UserService.generateResetTokenService(email);

    if (token) {
        await sendPasswordResetEmail(email, token, origin);
    }

    // Always return success to prevent timing attacks / user enumeration
    return { success: "If an account exists, a reset link has been sent." };
}

export async function resetPassword(prevState: any, formData: FormData): Promise<ActionState> {
    const token = formData.get("token") as string;
    const newPassword = formData.get("newPassword") as string;

    try {
        await UserService.resetPasswordService(token, newPassword);
        return { success: "Password reset successfully. You can now login." };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateLanguage(prevState: any, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const language = formData.get("language") as string;

    try {
        await UserService.updateLanguageService(session.user.id, language);
        revalidatePath("/");
        return { success: "Language updated successfully" };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function promoteToAdmin(prevState: any, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const code = formData.get("code") as string;
    if (!code || code.length !== 6) return { error: "Invalid code format." };

    try {
        const fs = require('fs');
        const path = require('path');
        const propsPath = path.join(process.cwd(), 'admin.properties');

        if (!fs.existsSync(propsPath)) {
            console.log('Action: File missing path', propsPath);
            return { error: "Configuration file missing." };
        }
        console.log('Action: File exists');

        const content = fs.readFileSync(propsPath, 'utf-8');
        const match = content.match(/admin\.code=(.{6})/);
        const serverCode = match ? match[1] : null;

        if (serverCode && code === serverCode) {
            await UserService.updateUserRoleService(session.user.id, "ADMIN");
            revalidatePath("/");
            return { success: "You are now an Administrator." };
        } else {
            return { error: "Incorrect code." };
        }
    } catch (e: any) {
        console.error(e);
        return { error: "System error during verification." };
    }
}