
import fs from "fs";

const data = JSON.parse(fs.readFileSync("C:\\Downloads\\TMT-backup-2026-04-20 (7).json", "utf-8"));
const prompts = data.prompts || data;

const targetId = "cmo7jk8g807q338ekfxox930u";
const found = prompts.find((p: any) => p.id === targetId);

if (found) {
    console.log(`FOUND skill item with id ${targetId}. Title: ${found.title}`);
} else {
    console.log(`Skill item with id ${targetId} NOT found in prompts array.`);
}
