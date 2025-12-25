
export const Routes = {
    HOME: "/",
    LOGIN: "/login",
    SIGNOUT: "/api/auth/signout",
    COLLECTIONS: "/collections",
    PROMPTS: "/prompts",
} as const;

export const AuthCallbackUrls = {
    LOGIN_CALLBACK: `${Routes.SIGNOUT}?callbackUrl=${Routes.LOGIN}`,
} as const;
