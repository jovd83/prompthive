"use client";

import { useState } from "react";
import { useLanguage } from "../LanguageProvider";
import CollapsibleSection from "../CollapsibleSection";
import { ShieldAlert } from "lucide-react";
import { updateGlobalSettings } from "@/actions/admin";
import { User } from "@prisma/client";
import UserManagement from "./UserManagement";
import ConfirmationDialog from "../ConfirmationDialog";

type AdminUser = Pick<User, "id" | "username" | "email" | "role" | "avatarUrl" | "createdAt">;

interface AdminSettingsProps {
    initialGlobalSettings?: {
        registrationEnabled: boolean;
        privatePromptsEnabled?: boolean;
    };
    initialUsers: AdminUser[];
}

export default function AdminSettings({ initialGlobalSettings, initialUsers }: AdminSettingsProps) {
    const { t } = useLanguage();
    const [registrationEnabled, setRegistrationEnabled] = useState(initialGlobalSettings?.registrationEnabled ?? true);
    const [privatePromptsEnabled, setPrivatePromptsEnabled] = useState(initialGlobalSettings?.privatePromptsEnabled ?? false);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage("");
        setMessageType('');
        try {
            await updateGlobalSettings({ registrationEnabled, privatePromptsEnabled });
            setMessage(t('admin.success'));
            setMessageType('success');
        } catch (error) {
            console.error(error);
            setMessage(t('admin.error'));
            setMessageType('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrivatePromptsToggle = (checked: boolean) => {
        if (!checked && privatePromptsEnabled) {
            // User is disabling it
            setIsConfirmOpen(true);
        } else {
            setPrivatePromptsEnabled(checked);
        }
    };

    const confirmDisablePrivatePrompts = () => {
        setPrivatePromptsEnabled(false);
        setIsConfirmOpen(false);
    };

    return (
        <CollapsibleSection
            title={t('admin.title')}
            defaultOpen={true}
        >
            <div className="space-y-4">
                {message && (
                    <div className={`p-3 rounded text-sm ${messageType === 'success' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
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
                            id="toggle-registration"
                            aria-label={t('admin.registration.title')}
                            className="sr-only peer"
                            checked={registrationEnabled}
                            onChange={(e) => setRegistrationEnabled(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                    </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900/20">
                    <div>
                        <h3 className="font-medium text-blue-900 dark:text-blue-100">{t('admin.privatePrompts.title') || "Private Prompts"}</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {t('admin.privatePrompts.desc') || "Allow users to create private prompts visible only to themselves."}
                        </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={privatePromptsEnabled}
                            onChange={(e) => handlePrivatePromptsToggle(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        data-testid="admin-save-button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? t('admin.saving') : t('admin.save')}
                    </button>
                </div>

                <UserManagement initialUsers={initialUsers} />
            </div>

            <ConfirmationDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={confirmDisablePrivatePrompts}
                title={t('admin.privatePrompts.title') || "Private Prompts"}
                description={t('admin.privatePrompts.confirmDisable') || "Are you sure? This will hide all private prompts from all users."}
                confirmLabel={t('common.verify') || "Confirm"}
                variant="warning"
            />
        </CollapsibleSection>
    );
}
