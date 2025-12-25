"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { getUsers, createUser, updateUserRole } from "@/actions/admin";
import { Plus, Search, Shield, User as UserIcon, Loader2 } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

type AdminUser = Pick<User, "id" | "username" | "email" | "role" | "avatarUrl" | "createdAt">;

export default function UserManagement({ initialUsers }: { initialUsers: AdminUser[] }) {
    const { t } = useLanguage();
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [isAddingString, setIsAdding] = useState(false); // Controls modal visibility
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // New User Form State
    const [newUserState, setNewUserState] = useState({ username: "", email: "", password: "", role: "USER" });
    const [createError, setCreateError] = useState("");

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError("");
        setIsLoading(true);

        try {
            const created = await createUser(newUserState);
            // We need to cast the result slightly because Date objects over wire might be strings or actual dates depending on nextjs serialization
            // But action returns the created user object. Just fetch fresh list or append. 
            // Appending optimistically is faster.
            const newUserFormatted: AdminUser = {
                id: created.id,
                username: created.username,
                email: created.email,
                role: created.role,
                avatarUrl: created.avatarUrl,
                createdAt: created.createdAt
            };

            setUsers([newUserFormatted, ...users]);
            setIsAdding(false);
            setNewUserState({ username: "", email: "", password: "", role: "USER" });
        } catch (err: any) {
            setCreateError(err.message || t('admin.users.add.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleToggle = async (userId: string, currentRole: string) => {
        const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
        // Optimistic update
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

        try {
            await updateUserRole(userId, newRole);
        } catch (err) {
            console.error("Failed to update role", err);
            // Revert on failure
            setUsers(users.map(u => u.id === userId ? { ...u, role: currentRole } : u));
        }
    };

    return (
        <div className="mt-8 border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <UserIcon size={18} />
                    {t('admin.users.title')}
                </h3>
                <button
                    onClick={() => setIsAdding(true)}
                    className="btn btn-sm btn-primary flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
                >
                    <Plus size={14} /> {t('admin.users.addUser')}
                </button>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                <input
                    type="text"
                    placeholder={t('admin.users.searchPlaceholder')}
                    className="input pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground sticky top-0">
                            <tr>
                                <th className="p-3 font-medium">{t('admin.users.table.user')}</th>
                                <th className="p-3 font-medium">{t('admin.users.table.role')}</th>
                                <th className="p-3 font-medium text-right">{t('admin.users.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3">
                                        <div className="font-medium">{user.username}</div>
                                        <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </td>
                                    <td className="p-3">
                                        <button
                                            onClick={() => handleRoleToggle(user.id, user.role)}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors ${user.role === 'ADMIN'
                                                ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            title="Click to toggle role"
                                        >
                                            {user.role === 'ADMIN' ? <Shield size={12} className="fill-current" /> : <UserIcon size={12} />}
                                            {user.role}
                                        </button>
                                    </td>
                                    <td className="p-3 text-right text-xs text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                        {t('admin.users.table.noUsers')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add User Modal */}
            {isAddingString && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">{t('admin.users.add.title')}</h2>
                        {createError && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md border border-red-200 dark:border-red-800">
                                {createError}
                            </div>
                        )}
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.users.add.username')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    required
                                    value={newUserState.username}
                                    onChange={e => setNewUserState({ ...newUserState, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.users.add.email')}</label>
                                <input
                                    type="email"
                                    className="input"
                                    required
                                    value={newUserState.email}
                                    onChange={e => setNewUserState({ ...newUserState, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.users.add.password')}</label>
                                <input
                                    type="password"
                                    className="input"
                                    required
                                    value={newUserState.password}
                                    onChange={e => setNewUserState({ ...newUserState, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('admin.users.add.role')}</label>
                                <select
                                    className="input"
                                    value={newUserState.role}
                                    onChange={e => setNewUserState({ ...newUserState, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAdding(false)}
                                    className="btn btn-ghost hover:bg-muted text-muted-foreground"
                                >
                                    {t('admin.users.add.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="btn btn-primary min-w-[100px]"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('admin.users.add.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
