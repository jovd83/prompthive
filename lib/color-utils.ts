
// Pre-defined palette matching services/prompts.ts for consistency
const TAG_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#22c55e", // Green
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#f43f5e", // Rose
];

export function generateColorFromName(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Use the hash to deterministically pick a color from the palette
    // consistent with the rest of the application
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
}
