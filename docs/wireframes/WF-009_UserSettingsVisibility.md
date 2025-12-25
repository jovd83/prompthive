# WF-009: User Settings - Visibility

## Overview
This wireframe describes the addition to the `SettingsForm` component, specifically the "User Visibility" section.

## Layout
The Settings page currently has tabs or sections. We will add a new fieldset or section for "User Visibility".

```
+-------------------------------------------------------+
|  Settings                                             |
+-------------------------------------------------------+
|                                                       |
|  [Backup Settings]                                    |
|  ...                                                  |
|                                                       |
|  User Visibility                                      |
|  ---------------------------------------------------  |
|  Select users whose prompts you want to see.          |
|                                                       |
|  [ Check All ] [ Uncheck All ]                        |
|                                                       |
|  +-------------------------------------------------+  |
|  | [x]  (Avatar) Me (You)               (Disabled) |  |
|  | [x]  (Avatar) Alice                             |  |
|  | [ ]  (Avatar) Bob                               |  |
|  | [x]  (Avatar) Charlie                           |  |
|  | ...                                             |  |
|  +-------------------------------------------------+  |
|  (Scrollable list max-height: 300px)                  |
|                                                       |
|  [ Save Settings ]                                    |
+-------------------------------------------------------+
```

## Interactions
1.  **Check All**: Sets all checkboxes (except disabled "Me") to TRUE.
2.  **Uncheck All**: Sets all checkboxes (except disabled "Me") to FALSE.
3.  **Individual Check**: Toggles state.
4.  **Save**: Submits the form. The backend logic interprets "Unchecked" as "Add to Hidden List".

## Visual Style
*   Use standard checkbox components.
*   User list item: Flex row with Avatar, Username, Email (optional/small).
*   Container: Bordered box with internal scrolling to prevent page blowout.
