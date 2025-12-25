# 🤖 AI Scraping & Import Guide

Use this guide to generate a prompt that you can send to powerful LLMs (like **Google Gemini**, **Claude 3.5 Sonnet**, or **ChatGPT**) to scrape prompts from any website and prepare them for one-click import into PromptHive.

---

## 📋 The Prompt

Copy and paste the following prompt into your LLM of choice. Replace `[URL]` with the website implementation you want to scrape.

```markdown
**Role**: You are an expert data scraper and JSON formatter specialized in generating import files for the "PromptHive" application.

**Task**: 
1. Access and analyze the content of the following URL: [URL]
2. Identify all AI prompts, system instructions, or LLM examples on the page.
3. Extract them into a key-value structure containing:
            - **title**: A short, descriptive title (max 50 chars).
            - **content**: The main system instruction or prompt text.
            - **description**: Any explanatory text or context provided near the prompt.
            - **tags**: An array of 2-3 relevant topic tags based on the content (e.g., ["writing", "coding"]).
            - **usageExample**: If the page provides a "User Input" example (what the user types), extract it here. Otherwise, null.
            - **variableDefinitions**: If the prompt uses placeholders (e.g., {{name}}), list them here as a comma-separated string (e.g., "{{name}}, {{date}}"). Otherwise, null.
            - **resultText**: If the page provides an "Output" or "Response" example from the AI, extract it here. Otherwise, null.
            - **resource**: The URL of the page being scraped ([URL]).
4. **CRITICAL REQUIREMENT**: Add a `collection` field to EVERY prompt object. The value of this field MUST be the current date plus "Scrape" (e.g., "2024-12-08 Scrape"). This ensures all imported prompts are grouped together.
5. Format the output as a valid JSON array.

**Target JSON Schema**:
```json
[
    {
      "title": "Example Prompt Title",
      "content": "You are a helpful assistant. Please summarize {{content}}.",
      "description": "Used for general text summarization.",
      "tags": ["writing", "summary"],
      "usageExample": "Here is an article about space...",
      "variableDefinitions": "{{content}}",
      "resultText": "The article establishes that space is big...",
      "resource": "https://example.com/prompts/123",
      "collection": "YYYY-MM-DD Scrape"
    }
]
```

**Constraints**:
- `content` must be a string. If the prompt has variables like {{name}}, preserve them.
- Output ONLY the raw JSON code block, no conversational filler.

**URL to Scrape**: [URL]
```

---

## 💡 How it Works

1.  **Copy** the text block above.
2.  **Paste** it into Gemini, Claude, or ChatGPT.
3.  **Replace** `[URL]` with the link you want to extract prompts from (e.g., a blog post top 10 list).
4.  **Run** the prompt.
5.  **Copy the JSON** output from the AI.
6.  **Save** it as a file named `import.json`.
7.  Go to **PromptHive > Import/Export**, select **"Import Prompts (Standard)"**, and upload your file.

## 🔍 Mapping Logic Explanation

To help you understand (or if you need to manually tweak the result), here is how we map the data:

| Web Content | JSON Field | Description |
| :--- | :--- | :--- |
| **Header (H2, H3)** | `title` | We use headings as the prompt title. |
| **Code Block / Blockquote** | `content` | The actual prompt text usually lives in preformatted blocks. |
| **User Input Example** | `usageExample` | Example of what a user might type. |
| **AI Output Example** | `resultText` | Example of what the AI might reply. |
| **Page URL** | `resource` | We link back to the original source. |
| **Date** | `collection` | We group this batch into a collection named with today's date. |

### Example Mapping

**Input (Website HTML):**
```html
<h2>Email Polisher</h2>
<p>Use this to fix your grammar.</p>
<blockquote>
Fix the grammar in the following text: {{text}}
</blockquote>
<p><strong>Example Output:</strong> "Your email is now polished."</p>
```

**Output (JSON):**
```json
[
  {
    "title": "Email Polisher",
    "description": "Use this to fix your grammar.",
    "content": "Fix the grammar in the following text: {{text}}",
    "variableDefinitions": "{{text}}",
    "resultText": "Your email is now polished.",
    "resource": "https://original-site.com/email-polisher",
    "tags": ["email", "grammar"],
    "collection": "2024-12-08 Scrape"
  }
]
```
