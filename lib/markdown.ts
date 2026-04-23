import { PromptDTO } from "./dto-mappers";
import { format } from "date-fns";

/**
 * Generates a markdown string for a prompt version.
 */
export function generateMarkdown(prompt: PromptDTO, versionId: string, agentSkills?: any[]): string {
    const version = (prompt.versions || []).find(v => v.id === versionId);
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

    const author = version.createdBy?.username || "Unknown";
    let md = `# ${prompt.title}

> ${prompt.description || "No description provided."}

**Version:** ${version.versionNumber} | **Date:** ${date} | **Author:** ${author}
**Tags:** ${tags}

---

## Prompt Content
\`\`\`text
${version.content}
\`\`\`
`;

    if (version.agentUsage) {
        md += `
## Agents
${version.agentUsage}
`;
    }

    if (agentSkills && agentSkills.length > 0) {
        md += `
## Agentskills
The following agentskills could be used to achieve the goals of this prompt and its tasks
` +
              agentSkills.map((s: any) => 
                `* ${s.title}\n** ${s.description || (s.versions?.[0]?.content ? s.versions[0].content.substring(0, 200) + '...' : "No description available")}\n** ${s.url || s.repoUrl || "No URL available"}`
              ).join("\n") +
              `\n`;
    }

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
