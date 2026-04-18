### Toggle Application Language Stress Test (Rapid Toggles)

**Title:** Toggle Application Language Stress Test (Rapid Toggles)

**Test Suite:** General Settings - Enriched Datasets & Stress Testing

**Preconditions**
1. User has access to the application via a standard browser

**Steps**

| Step | Action | Expected Result |
|---|---|---|
| 1 | Navigate through the UI to the application home page | Verify that the 'locator'main h1'' has text "/Paramètres/i" and Verify that the 'locator'main h1'' has text "/Settings/i" |

**Automated Test Mapping**
- **File:** `tests/e2e/regression/settings.spec.ts`
- **Test Name:** `Toggle Application Language Stress Test (Rapid Toggles)`
