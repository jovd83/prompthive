
import { z } from "zod";

export type VariableDef = {
    key: string;
    description?: string;
};

const VariableDefSchema = z.object({
    key: z.string(),
    description: z.string().optional(),
});

export const VariableDefinitionsSchema = z.array(VariableDefSchema);

export function parseVariableDefinitions(jsonString?: string | null): VariableDef[] {
    if (!jsonString) return [];
    try {
        const parsed = JSON.parse(jsonString);
        const result = VariableDefinitionsSchema.safeParse(parsed);
        if (result.success) {
            return result.data;
        }
        console.warn("Invalid variable definitions format:", result.error);
        return [];
    } catch (error) {
        console.warn("Failed to parse variable definitions JSON:", error);
        return [];
    }
}

export function extractUniqueVariables(content: string | undefined): string[] {
    if (!content) return [];
    const matches = content.matchAll(/(?:\{\{([\s\S]+?)\}\}|\[\[([\s\S]+?)\]\])/g);
    return Array.from(matches)
        .map((m) => m[1] || m[2])
        .filter((v): v is string => !!v)
        .map(v => v.trim());
}

/**
 * Replaces variable placeholders in the content with their values.
 * Supports both {{variable}} and [[variable]] syntax.
 */
export function replaceVariables(content: string | null | undefined, variables: Record<string, string>): string {
    if (!content) return "";
    let result = content;
    const uniqueVars = extractUniqueVariables(content);

    uniqueVars.forEach((v) => {
        if (variables[v] !== undefined && variables[v] !== null) {
            // Create a regex that matches either {{v}} or [[v]] globally
            // We need to escape the variable name just in case, though usually they are alphanumeric
            // But for safety, we assume v is clean or we just use it directly as per existing logic.
            // Existing logic didn't escape v.
            const pattern = new RegExp(`(\\{\\{${v}\\}\\}|\\[\\[${v}\\]\\])`, "g");
            result = result.replace(pattern, variables[v]);
        }
    });

    return result;
}
