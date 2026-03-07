# Experiment: Playwright Skills

This directory contains the results of an experiment with **Playwright Skills**, following the principles and patterns described in the [playwright-skill](https://github.com/testdino-hq/playwright-skill) repository.

## Overview
The goal of this experiment was to build a more robust, maintainable, and structured regression suite for PromptHive, moving away from fragile imperative scripts toward a Page Object Model (POM) and semantic-first approach.

## What has been created
- **`e2e/`**: Refactored specification files covering all major application Epics.
- **`pom/`**: A library of "Skills" (Page Objects) that encapsulate interactions with specific pages (Auth, Prompts, Collections, etc.).
- **`fixtures/`**: Custom Playwright fixtures (`db-fixture.ts`) that handle automated database seeding and cleanup using Prisma, ensuring test isolation.
- **`playwright.skills.config.ts`**: A dedicated configuration for this suite, optimized for stability and traceability.

## What is tested
We migrated and expanded the test suite to cover:
*   **Authentication**: Login, Registration, and session security.
*   **Prompt Management**: Creation, variables, versioning (history/restore), visual diffing, locking, and privacy.
*   **Collections**: Hierarchical organization, nested collections, and batch actions.
*   **Search & Discovery**: Advanced keyword filtering, tag/creator filtering, Command Palette navigation, and Technical ID resolution.
*   **Workflow Engine**: Complex prompt chaining, variable mapping between steps, and simulation of manual AI responses.
*   **Settings & Administration**: Global site flags, language preferences, and user-specific configurations.

## How it was decided what to test
The scope was determined by analyzing the existing application Epics (e.g., `Epic_Search_And_Discovery.md`, `Epic_Prompt_Management.md`). The priority was to ensure that the core "business logic" and complex state transitions (like version restoration or workflow execution) were covered with high reliability.

## How it was decided what to assert
Assertions follow a **User-Centric / Semantic** logic:
- Instead of asserting on CSS classes, we assert on what the user see and interacts with: **Roles** (`getByRole`), **Text** (`getByText`), and **Placeholders** (`getByPlaceholder`).
- **State Integrity**: Assertions also verify that the underlying database state matches the UI results (e.g., checking Prisma after a prompt creation).
- **URL Routing**: Verifying that navigation leads to the correct semantic paths.

## How the Skills are used
In this architecture, a **Skill** is an abstraction of a page or component's capabilities.
1.  **Encapsulation**: Tests do not know about internal selectors. They call high-level methods like `loginPage.login(user, pass)` or `searchPage.triggerCommandPalette()`.
2.  **Reusability**: Skills are shared across multiple specs (e.g., `LoginPage` is used in almost every setup).
3.  **Semantic Stability**: If the UI changes but the "role" (e.g., a "Save" button) stays the same, the Skill (and therefore the tests) remains intact.

## Operations: Run, Plan, Debug, Self-heal
- **Running**: Use the dedicated NPM script:
  ```bash
  npm run test:skills:e2e
  ```
- **Planning**: Plans were defined by breaking down Epics into reusable "Skill" methods before writing the specs.
- **Debugging**: The suite is configured with `trace: 'on-first-retry'`. Failed tests generate a full Playwright Trace, along with screenshots and videos, allowing for deep forensic analysis of failures.
- **Self-healing**: While the code is standard Playwright, the use of semantic locators (`getByRole`) provides a "natural" self-healing property where minor UI layout changes (like moving a button or changing colors) do not break the tests as long as the accessibility tree remains consistent. During development, an AI assistant can use the "Skill" definitions to proactively suggest fixes for broken locators.
