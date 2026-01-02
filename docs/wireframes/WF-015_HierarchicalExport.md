# Wireframe: Hierarchical Export & Progress
**Feature:** Advanced JSON Import/Export with Hierarchy
**Status:** Draft

## 1. Export UI (ImportExportContent.tsx)

### Standard Export Card
```
+---------------------------------------------------------------+
|  [Download] Export Prompts                                    |
|  Download all your prompts as a JSON file...                  |
|                                                               |
|  [ Select All ] [ Deselect All ]                              |
|                                                               |
|  [x] All Collections (Root)                                   |
|   |-[x] Marketing                                             |
|   |  |-[x] Blog Posts                                         |
|   |  L-[x] Social Media                                       |
|   |-[x] Coding                                                |
|                                                               |
|  [ Export JSON Button (Primary) ]                             |
+---------------------------------------------------------------+
```

### Exporting State (Progress Bar) - NEW
*Replaces the button/form while processing*

```
+---------------------------------------------------------------+
|  Exporting...                                                 |
|  [===========================           ] 75%                 |
|                                                               |
|  Processing collection: "Coding"                              |
|  145 / 200 prompts exported                                   |
|                                                               |
|  [ Cancel (Disabled) ]                                        |
+---------------------------------------------------------------+
```

### Success State
*Appears after completion*

```
+---------------------------------------------------------------+
|  (Green Check Icon) Export complete: 200 prompts exported.     |
+---------------------------------------------------------------+
|  [ Select All ] ... (Form resets for next use)                |
+---------------------------------------------------------------+
```

## 2. Import UI

### Importing State - NEW
*Matches the Export progress style*

```
+---------------------------------------------------------------+
|  Importing...                                                 |
|  [====================                  ] 45%                 |
|                                                               |
|  Restoring collection structure...                            |
|  45 / 100 prompts processed                                   |
+---------------------------------------------------------------+
```
