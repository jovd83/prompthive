import { User } from "@prisma/client";

export enum UserRole {
    ADMIN = "ADMIN",
    USER = "USER",
    GUEST = "GUEST",
}

export const ROLES = {
    ADMIN: "ADMIN",
    USER: "USER",
    GUEST: "GUEST",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Permission Actions
export type Action =
    | "create:prompt"
    | "edit:prompt"
    | "delete:prompt"
    | "create:collection"
    | "edit:collection"
    | "delete:collection"
    | "view:admin"
    | "manage:users"
    | "import"
    | "export"
    | "download";

// Role-based permissions map
const ROLE_PERMISSIONS: Record<Role, Action[]> = {
    [ROLES.ADMIN]: [
        "create:prompt",
        "edit:prompt",
        "delete:prompt",
        "create:collection",
        "edit:collection",
        "delete:collection",
        "view:admin",
        "manage:users",
        "import",
        "export",
        "download",
    ],
    [ROLES.USER]: [
        "create:prompt",
        "edit:prompt", // Own prompts
        "delete:prompt", // Own prompts
        "create:collection",
        "edit:collection", // Own collections
        "delete:collection", // Own collections
        "import",
        "export",
        "download",
    ],
    [ROLES.GUEST]: [
        // Read-only access implies NO mutation actions
    ],
};

export function hasPermission(user: { role?: string } | null | undefined, action: Action): boolean {
    if (!user || !user.role) return false;

    const userRole = user.role as Role;
    const permissions = ROLE_PERMISSIONS[userRole];

    if (!permissions) return false;

    return permissions.includes(action);
}

// Helper to check if user is guest
export function isGuest(user: { role?: string } | null | undefined): boolean {
    return user?.role === ROLES.GUEST;
}

export function isAdmin(user: { role?: string } | null | undefined): boolean {
    return user?.role === ROLES.ADMIN;
}

export function canEditPrompt(user: { id: string, role: string } | null | undefined, prompt: { createdById: string, isLocked?: boolean }): boolean {
    if (!user) return false;
    if (user.role === ROLES.ADMIN) return true; // Admins can probably edit anything or forced? Usually admins can.
    if (user.role === ROLES.GUEST) return false;

    // Regular user: can edit own prompts if not locked (or even if locked? usually locked means no edit)
    // Assuming logic: Only owner can edit.
    return user.id === prompt.createdById && !prompt.isLocked;
}
