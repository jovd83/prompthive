
export function detectFormat(data: any): 'PROMPTCAT' | 'STANDARD' {
    // 1. Check for Object-based PromptCat export (has 'prompts' or 'folders')
    if (typeof data === 'object' && !Array.isArray(data) && data !== null) {
        if ('prompts' in data || 'folders' in data) {
            return 'PROMPTCAT';
        }
    }
    // 2. Check for Array-based items
    else if (Array.isArray(data) && data.length > 0) {
        const first = data[0];
        // PromptCat items often have 'body' instead of 'content' (though mapped later), 
        // or 'categories' instead of 'collections', or 'notes'.
        // Standard MyPromptHive items usually have 'versions' array.
        if ((first.body !== undefined || first.categories !== undefined) && first.versions === undefined) {
            return 'PROMPTCAT';
        }
    }
    return 'STANDARD';
}
