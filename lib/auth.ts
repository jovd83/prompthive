import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { rateLimit } from "./rate-limit";
import { headers } from "next/headers";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }

                // --- SECURITY: Rate Limiting & User Enumeration Protection ---
                const headersList = await headers();
                const ip = headersList.get("x-forwarded-for") || "unknown";

                // Limit to 5 attempts per minute
                if (process.env.APP_ENV !== 'test' && rateLimit(`auth-${ip}`, 5, 60000)) {
                    throw new Error("Too many login attempts. Please wait a minute.");
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username },
                });

                // Subtle timing protection: always compare hashes even if user not found
                const dummyHash = "$2a$12$L7p6vV6o4R.G8.zG/vI6U.1g1A2B3C4D5E6F7G8H9I0J1K2L3M4N5"; // Valid structure
                const hashToVerify = user ? user.passwordHash : dummyHash;
                const isPasswordValid = await bcrypt.compare(credentials.password, hashToVerify);

                if (!user || !isPasswordValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
    },
};
