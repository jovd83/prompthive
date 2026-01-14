"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { getUsers, createUser, updateUserRole, deleteUser } from "@/actions/admin";
import { Plus, Search, Shield, User as UserIcon, Loader2, Trash2 } from "lucide-react";
import ConfirmationDialog from "../ConfirmationDialog";
import { useLanguage } from "../LanguageProvider";
import { ROLES } from "@/lib/permissions";

type AdminUser = Pick<User, "id" | "username" | "email" | "role" | "avatarUrl" | "createdAt">;

export default function UserManagement({ initialUsers }: { initialUsers: AdminUser[] }) {
    const { t } = useLanguage();
    const [users, setUsers] = useState<AdminUser[]>(initialUsers);
    const [isAddingString, setIsAdding] = useState(false); // Controls modal visibility
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // ... existing imports ...

    // New User Form State
    const [newUserState, setNewUserState] = useState({ username: "", email: "", password: "", role: ROLES.USER });
    const [createError, setCreateError] = useState("");
    const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError("");
        if (!newUserState.username || !newUserState.email || !newUserState.password) {
            setCreateError(t('admin.users.add.missingFields') || "Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const newUser = await createUser(newUserState);
            setUsers([...users, newUser]);
            setIsAdding(false);
            setNewUserState({ username: "", email: "", password: "", role: ROLES.USER });
            setSuccessMessage(t('admin.users.add.success') || "User created successfully");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err: any) {
            console.error("Failed to create user", err);
            setCreateError(err.message || "Failed to create user");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, currentRole: string, newRole: string) => {
        if (currentRole === newRole) return;

        // Optimistic update
        const previousUsers = [...users];
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as any } : u));

        try {
            await updateUserRole(userId, newRole);
            setSuccessMessage(t('admin.users.roleUpdateSuccess') || "User role updated");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err: any) {
            console.error("Failed to update user role", err);
            // Revert
            setUsers(previousUsers);
            alert(err.message || "Failed to update user role");
        }
    };

    const handleDeleteClick = (user: AdminUser) => {
        setUserToDelete(user);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        const previousUsers = [...users];
        const deletedUsername = userToDelete.username;
        setUsers(users.filter(u => u.id !== userToDelete.id));

        try {
            await deleteUser(userToDelete.id);
            setSuccessMessage(t('admin.users.deleteSuccess', { name: deletedUsername }) || `User ${deletedUsername} deleted successfully`);
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (err: any) {
            console.error("Failed to delete user", err);
            setUsers(previousUsers);
            alert(err.message || "Failed to delete user");
        } finally {
            setUserToDelete(null);
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

            {successMessage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-md border border-green-200 dark:border-green-800 animate-in fade-in slide-in-from-top-2">
                    {successMessage}
                </div>
            )}

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
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, user.role, e.target.value)}
                                            className={`text-xs font-medium border rounded px-2 py-1 outline-none focus:ring-2 focus:ring-ring ${user.role === ROLES.ADMIN
                                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                                                : user.role === ROLES.GUEST
                                                    ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                                                    : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                                                }`}
                                        >
                                            <option value={ROLES.USER}>User</option>
                                            <option value={ROLES.ADMIN}>Admin</option>
                                            <option value={ROLES.GUEST}>Guest</option>
                                        </select>
                                    </td>
                                    <td className="p-3 text-right text-xs text-muted-foreground flex items-center justify-end gap-2">
                                        <span suppressHydrationWarning>{new Date(user.createdAt).toLocaleDateString()}</span>
                                        <button
                                            onClick={() => handleDeleteClick(user)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title={t('admin.users.delete') || "Delete User"}
                                            data-testid={`delete-user-${user.username}`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
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
                                <label htmlFor="new-user-username" className="block text-sm font-medium mb-1">{t('admin.users.add.username')}</label>
                                <input
                                    id="new-user-username"
                                    type="text"
                                    className="input"
                                    required
                                    value={newUserState.username}
                                    onChange={e => setNewUserState({ ...newUserState, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="new-user-email" className="block text-sm font-medium mb-1">{t('admin.users.add.email')}</label>
                                <input
                                    id="new-user-email"
                                    type="email"
                                    className="input"
                                    required
                                    value={newUserState.email}
                                    onChange={e => setNewUserState({ ...newUserState, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="new-user-password" className="block text-sm font-medium mb-1">{t('admin.users.add.password')}</label>
                                <input
                                    id="new-user-password"
                                    type="password"
                                    className="input"
                                    required
                                    value={newUserState.password}
                                    onChange={e => setNewUserState({ ...newUserState, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="new-user-role" className="block text-sm font-medium mb-1">{t('admin.users.add.role')}</label>
                                <select
                                    id="new-user-role"
                                    className="input"
                                    value={newUserState.role}
                                    onChange={e => setNewUserState({ ...newUserState, role: e.target.value as any })}
                                >
                                    <option value={ROLES.USER}>User</option>
                                    <option value={ROLES.ADMIN}>Admin</option>
                                    <option value={ROLES.GUEST}>Guest</option>
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

            <ConfirmationDialog
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDelete}
                title={t('admin.users.deleteConfirmTitle') || "Delete User"}
                description={t('admin.users.deleteConfirmDesc') || "Are you sure you want to delete this user? This action cannot be undone and will remove all their data."}
                confirmLabel={t('admin.users.delete') || "Delete"}
                variant="danger"
            />
        </div>
    );
}
