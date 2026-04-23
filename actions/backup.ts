"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as BackupService from "@/services/backup";

export async function saveSettings(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const data = {
        autoBackupEnabled: formData.get("autoBackupEnabled") === "true",
        backupPath: formData.get("backupPath") as string,
        backupFrequency: formData.get("backupFrequency") as string,
    };

    await BackupService.saveSettingsService(session.user.id, data);

    revalidatePath("/settings");
}

export async function performBackup(userId: string, backupPath: string) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.id !== userId) throw new Error("Unauthorized backup attempt");

    const result = await BackupService.performBackupService(userId, backupPath);
    return result;
}

export async function checkAndRunAutoBackup(userId: string) {
    const session = await getServerSession(authOptions);
    if (!session) return;

    const settings = await prisma.settings.findUnique({ where: { userId } });
    if (!settings || !settings.autoBackupEnabled || !settings.backupPath) return;

    const lastBackup = settings.lastBackupAt ? new Date(settings.lastBackupAt) : new Date(0);
    const now = new Date();
    let shouldBackup = false;

    if (settings.backupFrequency === "DAILY") {
        if (now.getTime() - lastBackup.getTime() > 24 * 60 * 60 * 1000) shouldBackup = true;
    } else if (settings.backupFrequency === "WEEKLY") {
        if (now.getTime() - lastBackup.getTime() > 7 * 24 * 60 * 60 * 1000) shouldBackup = true;
    } else if (settings.backupFrequency === "MONTHLY") {
        if (now.getTime() - lastBackup.getTime() > 30 * 24 * 60 * 60 * 1000) shouldBackup = true;
    }

    if (shouldBackup) {
        const success = await BackupService.performBackupService(userId, settings.backupPath);
        if (success) {
            await prisma.settings.update({
                where: { userId },
                data: { lastBackupAt: new Date() }
            });
        }
    }
}

export async function dropAllData() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    await BackupService.dropAllDataService(session.user.id);
    revalidatePath("/");
}

export async function restoreLatestBackup() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    const settings = await prisma.settings.findUnique({ where: { userId: session.user.id } });
    if (!settings || !settings.backupPath) throw new Error("No backup path configured.");

    await BackupService.restoreLatestBackupService(session.user.id, settings.backupPath);

    revalidatePath("/");
    revalidatePath("/settings");

    return { success: true, message: "Database restored successfully." };
}
