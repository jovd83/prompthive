"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        if (res?.error) {
            setError("Invalid credentials");
        } else {
            router.push("/");
        }
    };

    return (
        <div className="card w-full max-w-md space-y-6 animate-fade-in flex flex-col items-center">
            <div className="flex justify-center mb-2">
                <img src="/logo-light.png" alt="MyPromptHive Logo" className="w-16 h-16 object-contain dark:hidden" />
                <img src="/logo-dark.png" alt="MyPromptHive Logo" className="w-16 h-16 object-contain hidden dark:block" />
            </div>
            <h1 className="text-2xl font-bold text-center">MyPromptHive</h1>
            {registered && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm text-center border border-green-200">
                    Account created successfully. Please sign in.
                </div>
            )}
            {error && <div className="text-red-500 text-center text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Username</label>
                    <input
                        type="text"
                        name="username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="input"
                        placeholder="username"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        required
                    />
                    <div className="flex justify-end mt-1">
                        <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                            Forgot password?
                        </a>
                    </div>
                </div>
                <button type="submit" className="btn btn-primary w-full">
                    Sign In
                </button>
                <div className="text-center text-sm">
                    <a href="/register" className="text-primary hover:underline">
                        Create New User
                    </a>
                </div>
            </form>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Suspense fallback={<div>Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
