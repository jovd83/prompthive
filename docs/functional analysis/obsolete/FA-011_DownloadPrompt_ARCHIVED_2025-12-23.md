# FA-011: Download Prompt as Markdown

## 1. Introduction
Allow users to download a prompt from the details page as a purely text-based Markdown (.md) file. This facilitates sharing, local archiving, and interoperability with other tools.

## 2. User Stories
### US-001: Download Button
**As a** user,
**I want to** see a "Download Markdown" button on the prompt detail page,
**So that** I can easily export the prompt content.

**Acceptance Criteria:**
- [ ] A download button (icon: Download/FileDown) appears in the action toolbar (near Edit/Delete/Favorite).
- [ ] The button has a tooltip "Download Markdown".

### US-002: Markdown Content Generation
**As a** user,
**I want to** the downloaded file to contain all text fields formatted nicely,
**So that** I can read it in any markdown viewer.

**Acceptance Criteria:**
- [ ] File format is `.md`.
- [ ] Filename logic: `{prompt_title_slug}_{version}.md` (e.g., `seo-blog-generator_v2.md`).
- [ ] **Included Fields:**
    - Title (H1)
    - Description
    - Metadata (Created By, Date, Version, Tags, Collection)
    - Prompt Content (Code block)
    - Variables (Table or List)
    - Source URL (if any)
    - Usage Examples (if any)
    - Long Version (if any)
- [ ] **Excluded but Referenced:**
    - Attachments (List filenames only, note "Not included in download")
    - Result Images (List filenames only, note "Not included in download")

## 3. Template Structure
The markdown should follow a standardized template:

```markdown
# {Title}

> {Description}

**Version:** {v} | **Date:** {date} | **Author:** {author}
**Tags:** {tags}

---

## Prompt Content
\`\`\`
{content}
\`\`\`

## Variables
| Name | Description |
|------|-------------|
| x    | y           |

## Metadata
*   **Collection:** {collection}
*   **Source:** {url}

## Attachments
*(Files are not included in this text export)*
*   {filename}
```
