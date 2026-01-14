"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { createPortal } from "react-dom";
import { useFormStatus } from "react-dom";
import { updateAvatar, changePassword, promoteToAdmin, type ActionState } from "@/actions/user";
import { X, Camera, Lock, User, Upload, LogOut, Globe, Shield } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ROLES } from "@/lib/permissions";

import { useLanguage } from "./LanguageProvider";

type UserProfileDialogProps = {
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
    isOpen: boolean;
    onClose: () => void;
};

const initialState: ActionState = {};

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="btn btn-primary w-full flex justify-center">
            {pending ? "Saving..." : label}
        </button>
    );
}

export default function UserProfileDialog({ user, isOpen, onClose }: UserProfileDialogProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'avatar' | 'password' | 'preferences'>('avatar');
    const [showAdminModal, setShowAdminModal] = useState(false);

    const [avatarState, avatarAction] = useActionState(async (prev: ActionState, formData: FormData): Promise<ActionState> => {
        try {
            return await updateAvatar(formData);
        } catch (e: any) {
            return { error: e.message };
        }
    }, initialState);

    const [passwordState, passwordAction] = useActionState(changePassword, initialState);

    const [adminState, adminAction] = useActionState(async (prev: ActionState, formData: FormData): Promise<ActionState> => {
        const res = await promoteToAdmin(prev, formData);
        if (res.success) {
            setShowAdminModal(false);
        }
        return res;
    }, initialState);

    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    if (!isOpen || !mounted) return null;

    const isAdmin = user.role === ROLES.ADMIN;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
            <div ref={modalRef} className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-border bg-background/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User size={20} /> {t('common.userProfile')}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex border-b border-border overflow-x-auto">
                    <button
                        type="button"
                        data-testid="tab-avatar"
                        onClick={() => setActiveTab('avatar')}
                        className={`flex-1 p-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'avatar' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-hover'}`}
                    >
                        {t('common.avatar')}
                    </button>
                    <button
                        type="button"
                        data-testid="tab-security"
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 p-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'password' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-hover'}`}
                    >
                        {t('common.security')}
                    </button>
                    {user.role !== ROLES.GUEST && (
                        <button
                            type="button"
                            data-testid="tab-preferences"
                            onClick={() => setActiveTab('preferences')}
                            className={`flex-1 p-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'preferences' ? 'border-b-2 border-primary text-primary bg-primary/5' : 'text-muted-foreground hover:bg-surface-hover'}`}
                        >
                            {t('common.preferences')}
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {activeTab === 'avatar' && (
                        <div className="space-y-6" data-testid="content-avatar">
                            <div className="flex flex-col items-center gap-4">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-surface shadow-inner bg-secondary/20 flex items-center justify-center">
                                        {user.image ? (
                                            <img src={user.image} alt="Avatar" className="object-cover w-full h-full" />
                                        ) : (
                                            <User size={48} className="text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="font-medium text-lg">{user.name}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                    {isAdmin && <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-bold uppercase tracking-wider">Admin</span>}
                                </div>
                            </div>

                            <form action={avatarAction} className="space-y-4">
                                <label className="flex flex-col items-center gap-2 cursor-pointer border-2 border-dashed border-border rounded-lg p-6 hover:bg-primary/5 hover:border-primary/50 transition-colors">
                                    <Upload className="text-muted-foreground" />
                                    <span className="text-sm font-medium">{t('common.clickToUpload')}</span>
                                    <input type="file" name="avatar" accept="image/*" className="hidden" onChange={(e) => e.target.form?.requestSubmit()} />
                                </label>
                                {avatarState?.error && <p className="text-red-500 text-sm text-center">{avatarState.error}</p>}
                                {avatarState?.success && <p className="text-green-500 text-sm text-center">{avatarState.success}</p>}
                            </form>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <form action={passwordAction} className="space-y-4" data-testid="content-security">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('common.currentPassword')}</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                                    <input type="password" name="currentPassword" className="input pl-10 w-full" placeholder="••••••••" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t('common.newPassword')}</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                                    <input type="password" name="newPassword" className="input pl-10 w-full" placeholder="••••••••" required />
                                </div>
                            </div>

                            {passwordState?.error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-md">{passwordState.error}</div>}
                            {passwordState?.success && <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-md">{passwordState.success}</div>}

                            <SubmitButton label={t('common.save')} />
                        </form>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="space-y-6" data-testid="content-preferences">



                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/10">
                                    <div className="flex items-center gap-4">
                                        <Shield className={`w-8 h-8 ${isAdmin ? 'text-green-500' : 'text-muted-foreground'}`} />
                                        <div>
                                            <h3 className="font-medium">{t('common.adminAccess')}</h3>
                                            <p className="text-xs text-muted-foreground">{isAdmin ? t('common.adminUser') : t('common.adminDesc')}</p>
                                        </div>
                                    </div>
                                    {!isAdmin && (
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={false} onChange={() => setShowAdminModal(true)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    )}
                                    {isAdmin && <span className="text-green-600 font-bold text-sm">{t('common.adminActive')}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border bg-background/50 flex justify-end">
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors"
                    >
                        <LogOut size={16} />
                        {t('common.signOut')}
                    </button>
                </div>
            </div>

            {showAdminModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-surface border border-border rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">{t('common.enterAdminCode')}</h3>
                        <form action={adminAction} className="space-y-4">
                            <input type="text" name="code" className="input w-full text-center tracking-widest text-2xl uppercase" maxLength={6} placeholder="######" autoFocus />

                            {adminState?.error && <p className="text-red-500 text-sm text-center">{adminState.error}</p>}

                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAdminModal(false)} className="btn btn-secondary flex-1">{t('common.cancel')}</button>
                                <SubmitButton label={t('common.verify')} />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
}
