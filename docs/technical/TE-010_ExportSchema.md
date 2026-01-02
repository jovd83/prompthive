# TE-010: Unified Export JSON Schema v2

## Overview
This document describes the updated JSON schema for PromptHive's export functionality. Version 2 introduces support for hierarchical collections preservation during import/export cycles.

## Schema Structure

The export file is a JSON object (previously an Array in v1).

### Root Object

```json
{
  "version": 2,
  "exportedAt": "ISO-8601 Date String",
  "prompts": [ ... ],
  "definedCollections": [ ... ]
}
```

*   `version`: Integer. Current version is 2.
*   `prompts`: Array. List of Prompt objects (Same as v1 schema but wrapped).
*   `definedCollections`: Array. List of Collection hierarchy metadata.

### Defined Collections Object

This array is essential for reconstructing the tree structure.

```json
{
  "id": "uuid-string",
  "title": "Collection Name",
  "description": "Optional description",
  "parentId": "uuid-string-of-parent" | null
}
```

*   `id`: The original ID is preserved for reference mapping but may be regenerated on import if collisions occur.
*   `parentId`: Refers to another ID within this same array.

## Backward Compatibility

### Importing v1 (Array)
If the import file is a raw Array `[...]`, the system treats it as `version: 1`. It will import prompts but will **flatten** collections (recreating them at root level based on unique names), as no parent-child relationship data exists.

### Importing v2
1.  System reads `definedCollections` first.
2.  It creates/finds collections in order (Parents first, then Children).
3.  It maps the old IDs to the newly created IDs.
4.  It imports `prompts` and links them to the new Collection IDs.

## Export Logic
The export function must:
1.  Identify all collections referenced by the selected prompts.
2.  Also identify all **ancestor** collections of those referenced, even if the ancestors contain no selected prompts themselves, to preserve the path.
3.  Serialize this structural subset into `definedCollections`.
