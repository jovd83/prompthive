
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Sends a welcome email to the new user.
 * Currently mocked to log to a file.
 */
export async function sendWelcomeEmail(email: string): Promise<void> {
    const logDir = path.join(process.cwd(), 'logs');

    try {
        await fs.mkdir(logDir, { recursive: true });
        const logFile = path.join(logDir, 'email.log');
        const timestamp = new Date().toISOString();
        const message = `[${timestamp}] [WELCOME EMAIL] To: ${email} | Subject: Welcome to PromptHive!\n`;

        await fs.appendFile(logFile, message);
        console.log(`[Mock Email] Welcome email sent to ${email}`);
    } catch (error) {
        console.error("Failed to log welcome email:", error);
        // We do not throw here to avoid failing the registration if logging fails
    }
}

/**
 * Sends a password reset email.
 * Currently mocked to log to a file.
 */
export async function sendPasswordResetEmail(email: string, token: string, origin: string): Promise<void> {
    const logDir = path.join(process.cwd(), 'logs');
    const resetLink = `${origin}/reset-password?token=${token}`;

    try {
        await fs.mkdir(logDir, { recursive: true });
        const logFile = path.join(logDir, 'email.log');
        const timestamp = new Date().toISOString();
        const message = `[${timestamp}] [RESET PASSWORD] To: ${email} | Link: ${resetLink}\n`;

        await fs.appendFile(logFile, message);
        console.log(`[Mock Email] Reset email sent to ${email}`);
    } catch (error) {
        console.error("Failed to log reset email:", error);
    }
}
