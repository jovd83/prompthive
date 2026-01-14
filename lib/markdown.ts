import { PromptWithRelations } from "@/types/prisma";
import { format } from "date-fns";

/**
 * Generates a markdown string for a prompt version.
 */
export function generateMarkdown(prompt: PromptWithRelations, versionId: string): string {
    const version = prompt.versions.find(v => v.id === versionId);
    if (!version) return "";

    const date = format(new Date(version.createdAt), "yyyy-MM-dd");
    const tags = prompt.tags?.map(t => `#${t.name}`).join(", ") || "None";
    const collection = prompt.collections?.map(c => c.title).join(", ") || "None";
    const variableDefs = version.variableDefinitions ? JSON.parse(version.variableDefinitions) : [];

    // Attachments
    const resultFiles = version.attachments?.filter(a => a.role === 'RESULT').map(a => a.filePath.split('/').pop()) || [];
    const otherFiles = version.attachments?.filter(a => a.role !== 'RESULT').map(a => a.filePath.split('/').pop()) || [];
    const legacyResult = version.resultImage ? [version.resultImage.split('/').pop()] : [];
    const allFileNames = [...resultFiles, ...otherFiles, ...legacyResult].filter(Boolean);

    let md = `# ${prompt.title}

> ${prompt.description || "No description provided."}

**Version:** ${version.versionNumber} | **Date:** ${date} | **Author:** ${version.createdBy.username}
**Tags:** ${tags}

---

## Prompt Content
\`\`\`text
${version.content}
\`\`\`
`;

    if (version.shortContent) {
        md += `
## Short Prompt
\`\`\`text
${version.shortContent}
\`\`\`
`;
    }

    if (version.usageExample) {
        md += `
## Usage Example
\`\`\`text
${version.usageExample}
\`\`\`
`;
    }

    if (variableDefs.length > 0) {
        md += `
## Variables
| Name | Description |
|------|-------------|
${variableDefs.map((v: any) => `| ${v.key} | ${v.description || ""} |`).join("\n")}
`;
    }

    md += `
## Metadata
*   **Collection:** ${collection}
*   **Source:** ${prompt.resource || "None"}
`;

    if (allFileNames.length > 0) {
        md += `
## Attachments
*(Files are not included in this text export)*
${allFileNames.map((f: any) => `*   ${f}`).join("\n")}
`;
    }

    return md;
}

/**
 * Trigger a browser download of the string as a file.
 */
export function downloadStringAsFile(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
