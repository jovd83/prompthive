import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'locales');
const enContent = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf-8'));

function flattenKeys(obj: any, prefix = ''): string[] {
    let keys: string[] = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(flattenKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const enKeys = flattenKeys(enContent.commandPalette, 'commandPalette.');
const enHelpKeys = flattenKeys(enContent.help.content.commandPalette, 'help.content.commandPalette.');

const allTargetKeys = [...enKeys, ...enHelpKeys];

const files = fs.readdirSync(localesDir);
let hasError = false;

files.forEach(file => {
    if (file === 'en.json') return;
    const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf-8'));
    const fileKeys = new Set([
        ...flattenKeys(content.commandPalette || {}, 'commandPalette.'),
        ...flattenKeys(content.help?.content?.commandPalette || {}, 'help.content.commandPalette.')
    ]);

    const missing = allTargetKeys.filter(k => !fileKeys.has(k));
    if (missing.length > 0) {
        console.error(`File ${file} is missing keys:`, missing);
        hasError = true;
    } else {
        console.log(`File ${file} is OK.`);
    }
});

if (hasError) {
    process.exit(1);
} else {
    console.log("All translations present.");
}
