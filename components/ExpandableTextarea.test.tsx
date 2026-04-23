
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ExpandableTextarea from "./ExpandableTextarea";
import { LanguageProvider } from "./LanguageProvider";

// Mock the LanguageProvider
vi.mock("./LanguageProvider", () => ({
    useLanguage: () => ({ t: (key: string) => key }),
    LanguageProvider: ({ children }: any) => <div>{children}</div>
}));

describe("ExpandableTextarea", () => {
    it("renders textarea with correct value", () => {
        render(<ExpandableTextarea value="Initial Value" onChange={() => { }} />);
        expect(screen.getByDisplayValue("Initial Value")).toBeDefined();
    });

    it("opens modal on click", () => {
        render(<ExpandableTextarea value="Initial" onChange={() => { }} label="Test Label" />);
        const button = screen.getByTitle("detail.actions.maximize");
        fireEvent.click(button);
        // Check for modal presence by looking for the label in the modal header
        expect(screen.getByText("Test Label")).toBeDefined();
        // Check for textarea in modal
        const textareas = screen.getAllByRole("textbox");
        expect(textareas.length).toBeGreaterThan(1); // One in main, one in modal
    });
});
