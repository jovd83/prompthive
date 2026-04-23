# Technical Documentation: Source-of-Truth Policy Integration (DEPRECATED)

> [!WARNING]
> This feature has been integrated into the [Advanced Copy Feature](./Feature-Advanced-Copy.md). 
> The standalone SOT button described here has been removed.

## 📋 Feature Overview
The **Source-of-Truth (SOT) Policy** is a mandatory instruction block that can be optionally appended to any prompt when copying to the clipboard. It forces the target AI model to prioritize project-specific artifacts and specialized Agent Skills over its internal training data.

## 🏗️ Technical Implementation

### 1. Clipboard Transformation Logic
The copying logic in `components/PromptDetail.tsx` (and `components/prompt-detail/PromptContent.tsx` for consistency) is extended to support two modes:
- **Standard Copy**: Prompt Content + Agent Instructions + Agent Skills.
- **SOT Copy**: Prompt Content + Agent Instructions + Agent Skills + **STRICT SOURCE-OF-TRUTH POLICY**.

The policy is defined as a `SOT_POLICY` constant within the components to ensure strict adherence to the project's quality standards.

### 2. UI Components
- **`PromptContent.tsx`**: Added a new primary action button "Copy with SOT Policy".
- **Icon**: Uses `ShieldCheck` from `lucide-react` to symbolize the "enforcement" nature of the policy.

### 3. Localization
The feature introduces new localized strings in `locales/en.json` (and other languages):
- `detail.actions.copyWithSot`: "SOT Copy"
- `detail.actions.copiedWithSot`: "SOT Copied!"

### 4. Analytics
- Event type: `copy_with_sot`
- Payload: `{ promptId: string, type: "copy_with_sot" }`

## 🧩 Policy Payload Structure
When copied with SOT, the payload structure is:

```text
[Main Prompt Body]

[Optional Agent Instructions]

[Optional Agent Skills]

--------------------------------------------------------------------------------
STRICT SOURCE-OF-TRUTH POLICY

You must not rely on training knowledge, cached memory, prior conversation context...
[Full Policy Body]
--------------------------------------------------------------------------------
```

## ✅ Verification
- **Unit Tests**: Verifying the string construction logic.
- **E2E Tests**: Verifying the clipboard content via Playwright.
