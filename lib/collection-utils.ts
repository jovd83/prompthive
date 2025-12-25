export type CollectionWithCount = {
    id: string;
    title: string;
    parentId: string | null;
    _count?: { prompts: number };
    children?: CollectionWithCount[]; // For tree building
    totalPrompts?: number; // Computed recursive count
};

export function computeRecursiveCounts(collections: CollectionWithCount[]) {
    // 1. Create a map for quick lookup and initialize children array
    const map = new Map<string, CollectionWithCount>();
    collections.forEach(c => {
        // Create a shallow copy to avoid mutating the original objects too deeply if they are frozen,
        // but we want to link them.
        map.set(c.id, { ...c, children: [], totalPrompts: 0 });
    });

    // 2. Build Tree and Identify Roots
    const roots: CollectionWithCount[] = [];
    map.forEach(node => {
        if (node.parentId && map.has(node.parentId)) {
            map.get(node.parentId)!.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    // 3. Compute Counts (Post-order traversal)
    const processNode = (node: CollectionWithCount): number => {
        let count = node._count?.prompts || 0;
        if (node.children) {
            node.children.forEach(child => {
                count += processNode(child);
            });
        }
        node.totalPrompts = count;
        return count;
    };

    roots.forEach(root => processNode(root));

    // 4. Return the map for easy lookup of any collection's total
    return map;
}
