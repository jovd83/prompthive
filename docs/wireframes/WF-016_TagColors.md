# WF-016 Tag Colors and Settings

## 1. Overview
This wireframe describes the UI updates for the Tag Colors feature, which allows users to toggle between colorful tags and uniform tags, and see distinct colors for tags when enabled.

## 2. Settings Page Update (General Settings)
**Location:** `/settings` (General Tab)

### Current State
```
[General Settings]
[ ] Show Prompting Tips
[ ] Language: [English]
```

### Proposed State
```
[General Settings]
[Toggle] Show Prompting Tips
    Display a daily prompting tip on the dashboard

[Toggle] Enable Tag Colors
    Show distinct colors for each tag. If disabled, all tags will use the default system color.

[Dropdown] Language: [English]
```

## 3. Tag Display (TagSelector / Prompt Views)

### State A: Tag Colors Enabled (Default)
Tags appear with distinct background/border colors derived from their assigned color.
```
[Tag: Innovation](blue-bg) [Tag: AI](red-bg) [Tag: Coding](green-bg)
```
*Visual Style:*
- Background: `hex` with low opacity (e.g. 10-20%)
- Text: `hex`
- Border: `hex` with medium opacity (e.g. 30-50%)

### State B: Tag Colors Disabled
Tags appear with uniform system default styling.
```
[Tag: Innovation](gray-bg) [Tag: AI](gray-bg) [Tag: Coding](gray-bg)
```
*Visual Style:*
- Matches current implementation (primary/10 background, primary text).
