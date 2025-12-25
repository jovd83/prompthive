
import { describe, it, expect } from 'vitest';
import { detectFormat } from "@/lib/import-utils";

describe("detectFormat", () => {
    it("should detect PromptCat export (object with prompts)", () => {
        const data = { prompts: [{ title: "Test" }] };
        expect(detectFormat(data)).toBe("PROMPTCAT");
    });

    it("should detect PromptCat export (object with folders)", () => {
        const data = { folders: [{ name: "Category" }] };
        expect(detectFormat(data)).toBe("PROMPTCAT");
    });

    it("should detect PromptCat export (array with body)", () => {
        const data = [{ title: "Test", body: "Content" }];
        expect(detectFormat(data)).toBe("PROMPTCAT");
    });

    it("should detect PromptCat export (array with categories)", () => {
        const data = [{ title: "Test", categories: ["A"] }];
        expect(detectFormat(data)).toBe("PROMPTCAT");
    });

    it("should detect Standard Hive export (array with versions)", () => {
        const data = [{ title: "Test", versions: [{ content: "C" }] }];
        expect(detectFormat(data)).toBe("STANDARD");
    });

    it("should detect Standard Hive export (array with content, no body)", () => {
        const data = [{ title: "Test", content: "C" }];
        expect(detectFormat(data)).toBe("STANDARD");
    });

    it("should return STANDARD for empty array", () => {
        const data: any[] = [];
        expect(detectFormat(data)).toBe("STANDARD");
    });

    it("should return STANDARD for unknown object", () => {
        const data = { something: "else" };
        expect(detectFormat(data)).toBe("STANDARD");
    });
});
