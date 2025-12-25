
"use client";

import { Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { UserBasic, Settings } from "@/types/settings";

import UserVisibilitySettings from "./settings/UserVisibilitySettings";
import BackupSettings from "./settings/BackupSettings";
import DangerZoneSettings from "./settings/DangerZoneSettings";
import GeneralSettings from "./settings/GeneralSettings";
import LanguageSettings from "./settings/LanguageSettings";
import AdminSettings from "./settings/AdminSettings";

interface SettingsFormProps {
    initialSettings: Settings;
    allUsers?: UserBasic[];
    initialHiddenIds?: string[];
    currentUserId?: string;
    isAdmin?: boolean;
    initialGlobalSettings?: {
        registrationEnabled: boolean;
    };
    initialUsers?: any[]; // Using any[] temporarily to avoid deep imports, or Pick<User...>
}

export default function SettingsForm({
    initialSettings,
    allUsers = [],
    initialHiddenIds = [],
    currentUserId,
    isAdmin = false,
    initialGlobalSettings,
    initialUsers = []
}: SettingsFormProps) {
    const { t } = useLanguage();

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <SettingsIcon size={32} className="text-primary" />
                <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
                <span className={`text-xs px-2 py-1 rounded-full border ${isAdmin ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}`}>
                    {isAdmin ? 'Admin' : 'User'}
                </span>
            </div>

            <GeneralSettings initialSettings={initialSettings} />

            <LanguageSettings />

            <UserVisibilitySettings
                allUsers={allUsers}
                initialHiddenIds={new Set(initialHiddenIds)}
                currentUserId={currentUserId}
            />

            {isAdmin && (
                <>
                    <AdminSettings initialGlobalSettings={initialGlobalSettings} initialUsers={initialUsers} />
                    <BackupSettings initialSettings={initialSettings} />
                    <DangerZoneSettings />
                </>
            )}
        </div>
    );
}
