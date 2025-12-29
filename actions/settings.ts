"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateVisibilitySettingsService, updateGeneralSettingsService, updateCollectionVisibilitySettingsService } from "@/services/settings";
import { revalidatePath } from "next/cache";

export type ActionState = {
    success?: string;
    error?: string;
};

export async function saveVisibilitySettings(prevState: any, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const hiddenIdsJson = formData.get("hiddenUserIds") as string;
    let hiddenIds: string[] = [];
    try {
        hiddenIds = JSON.parse(hiddenIdsJson);
    } catch (e) {
        return { error: "Invalid data format" };
    }

    try {
        await updateVisibilitySettingsService(session.user.id, hiddenIds);
        revalidatePath("/");
        revalidatePath("/settings");
        return { success: "Visibility settings saved." };
    } catch (e: any) {
        console.error(e);
        return { error: "Failed to save settings." };
    }
}

export async function saveGeneralSettings(prevState: any, formData: FormData): Promise<ActionState> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Unauthorized" };

    const showPrompterTips = formData.get("showPrompterTips") === "on";

    try {
        await updateGeneralSettingsService(session.user.id, { showPrompterTips });
        revalidatePath("/");
        revalidatePath("/settings");
        return { success: "Settings saved." };
    } catch (e: any) {
        console.error(e);
        return { error: "Failed to save settings." };
    }
}

export async function saveCollectionVisibilityAction(hiddenIds: string[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await updateCollectionVisibilitySettingsService(session.user.id, hiddenIds);
        revalidatePath("/"); // Revalidate sidebar
        revalidatePath("/collections"); // Revalidate main page
        revalidatePath("/settings");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        throw new Error(e.message || "Failed to save");
    }
}
