"use client";

import { useActionState, Suspense } from "react";
import { useFormStatus } from "react-dom";
import { resetPassword } from "@/actions/user";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { useSearchParams } from "next/navigation";


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className="btn btn-primary w-full flex items-center justify-center gap-2">
            {pending ? "Resetting..." : "Set New Password"}
        </button>
    );
}

const initialState: { success?: string; error?: string } = {};

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [state, formAction] = useActionState(resetPassword, initialState);

    if (!token) {
        return (
            <div className="text-center space-y-4">
                <div className="text-red-500 bg-red-500/10 p-4 rounded-md border border-red-500/20">
                    Missing reset token. Please request a new link.
                </div>
                <Link href="/forgot-password" className="btn btn-outline w-full justify-center">
                    Go to Forgot Password
                </Link>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-4 w-full">
            <input type="hidden" name="token" value={token} />
            <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3 text-muted-foreground" />
                    <input
                        type="password"
                        name="newPassword"
                        className="input pl-10 w-full"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
            </div>

            {state?.error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-md text-center">{state.error}</div>}
            {state?.success && (
                <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-500 text-sm rounded-md text-center">
                        {state.success}
                    </div>
                    <Link href="/login" className="btn btn-primary w-full justify-center">
                        Proceed to Login
                    </Link>
                </div>
            )}

            {!state?.success && <SubmitButton />}

            {!state?.success && (
                <div className="text-center pt-2">
                    <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors">
                        <ArrowLeft size={14} /> Back to Login
                    </Link>
                </div>
            )}
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="card w-full max-w-md space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col items-center border border-border/50 shadow-2xl bg-surface/50 backdrop-blur-sm">
                <div className="flex justify-center mb-2">
                    <img src="/logo-light.png" alt="MyPromptHive Logo" className="w-12 h-12 object-contain dark:hidden" />
                    <img src="/logo-dark.png" alt="MyPromptHive Logo" className="w-12 h-12 object-contain hidden dark:block" />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Set New Password</h1>
                    <p className="text-muted-foreground text-sm">Create a secure password for your account.</p>
                </div>

                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
