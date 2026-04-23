
import fs from "fs";

const data = JSON.parse(fs.readFileSync("C:\\Downloads\\TMT-backup-2026-04-20 (7).json", "utf-8"));
const prompts = data.prompts || data;
const found = prompts.find((p: any) => p.id === "cmo7jk8g807q338ekfxox930u");
console.log("Title of cmo7jk8g8:", found?.title);
