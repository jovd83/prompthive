
import fs from "fs";

function checkSpecificIds() {
    const filePath = "C:\\Downloads\\TMT-backup-2026-04-20 (2).json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    
    const targetIds = [
        "cmo7h0188003438q42vnny0kc",
        "cmo7h018j003g38q4k4jf34t2"
    ];
    
    const allIds = new Set(data.prompts.map((p: any) => p.id).filter(Boolean));
    
    targetIds.forEach(id => {
        console.log(`ID ${id} present as top-level ID: ${allIds.has(id)}`);
    });
}

checkSpecificIds();
