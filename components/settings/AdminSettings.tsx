"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import CollapsibleSection from "../CollapsibleSection";
import { ShieldAlert } from "lucide-react";
import { updateGlobalSettings } from "@/actions/admin";
import { User } from "@prisma/client";
import UserManagement from "./UserManagement";

type AdminUser = Pick<User, "id" | "username" | "email" | "role" | "avatarUrl" | "createdAt">;

interface AdminSettingsProps {
    initialGlobalSettings?: {
        registrationEnabled: boolean;
    };
    initialUsers: AdminUser[];
}

export default function AdminSettings({ initialGlobalSettings, initialUsers }: AdminSettingsProps) {
    const { t } = useLanguage();
    const [registrationEnabled, setRegistrationEnabled] = useState(initialGlobalSettings?.registrationEnabled ?? true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        try {
            await updateGlobalSettings({ registrationEnabled });
            setMessage(t('admin.success'));
        } catch (error) {
            console.error(error);
            setMessage(t('admin.error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <CollapsibleSection
            title={t('admin.title')}
            defaultOpen={true}
        >
            <div className="space-y-4">
                {message && (
                    <div className={`p-3 rounded text-sm ${message.includes("success") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {message}
                    </div>
                )}

                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900/20">
                    <div>
                        <h3 className="font-medium text-red-900 dark:text-red-100">{t('admin.registration.title')}</h3>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            {t('admin.registration.desc')}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={registrationEnabled}
                            onChange={(e) => setRegistrationEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? t('admin.saving') : t('admin.save')}
                    </button>
                </div>

                <UserManagement initialUsers={initialUsers} />
            </div>
        </CollapsibleSection>
    );
}
