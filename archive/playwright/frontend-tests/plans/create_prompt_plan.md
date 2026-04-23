# Test Plan: Create Prompt

## User Story
**As a** User
**I want to** create a new prompt template
**So that** I can reuse and share my best prompts.

## Assumptions
- The application is running.
- A user is logged in.

## Specific Locators Found by Static Analysis
- **Title Input**: `input[name='title']`
- **Description Input**: `textarea[name='description']`
- **Content textarea**: `textarea[name='content']` or Monaco editor within `[name='content']`
- **Auto Add Variables Button**: Button containing 'Auto Add' or similar (by guessing translations or index in Variable section).
- **File Uploads**: `input[type='file'][accept*='.txt']`
- **Submit Button**: `button[type='submit']`
- **Private Checkbox**: `input[name='isPrivate']`

---

## Scenario 1: Require Content
1. **Navigate**: Go to `/prompts/new`.
2. **Submit**: Click "Create Prompt" button.
3. **Expected Outcome**: Form does not submit because `content` is a required field. URL remains `/prompts/new`.

## Scenario 2: Auto-Add Variables Detects Syntaxes
1. **Navigate**: Go to `/prompts/new`.
2. **Input Fields**:
    - Fill Title with `My Variable Prompt`.
    - Fill Content with `Here is {{var1}} and [[var2]]`.
3. **Action**: Click "Auto Add Variables".
4. **Expected Outcome**: Two rows appear in the variables list with inputs containing `var1` and `var2`.
5. **Submit**: Click submit.
6. **Expected Outcome**: Redirected to `/prompts/[cuid]`.

## Scenario 3: Attachments File Upload
1. **Navigate**: Go to `/prompts/new`.
2. **Input Fields**:
    - Fill Title with `Attachment Prompt`.
    - Fill Content with `Some content`.
3. **Action**: Upload a dummy `.txt` file to the attachment input.
4. **Submit**: Click submit.
5. **Expected Outcome**: Redirected to `/prompts/[cuid]`. The detail page should display the original file name.
