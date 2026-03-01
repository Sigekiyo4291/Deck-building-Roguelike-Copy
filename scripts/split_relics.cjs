const fs = require('fs');
const path = require('path');

const relicTsPath = path.join(__dirname, '../src/core/relic.ts');
const relicClassTsPath = path.join(__dirname, '../src/core/relic-class.ts');
const outDir = path.join(__dirname, '../src/core/relics');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const source = fs.readFileSync(relicTsPath, 'utf8');

// 1. Extract Relic class
const classMatch = source.match(/export class Relic[\s\S]*?\n\}/);
if (classMatch) {
    const classDef = `import { RoomType } from './map-data';\n\n${classMatch[0]}\n`;
    fs.writeFileSync(relicClassTsPath, classDef, 'utf8');
}

// 2. Parse RelicLibrary keys
const libraryMatch = source.match(/export const RelicLibrary = \{([\s\S]*?)\n\};\n*$/);
if (!libraryMatch) {
    console.error("RelicLibrary not found.");
    process.exit(1);
}

const libraryBody = libraryMatch[1];
const items = [];
const lines = libraryBody.split('\n');
let currentItem = '';
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (currentItem === '' && line.trim() === '') continue; // Skip initial empties
    if (currentItem === '' && line.trim().startsWith('//')) {
        // We can just skip comments or attach them
        continue;
    }

    currentItem += line + '\n';
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    // Check if we reached the end of an item (e.g. `},` or `} `)
    // Sometimes it's the last item so there is no comma
    if (braceCount === 0 && currentItem.trim().length > 0) {
        if (currentItem.trim().match(/^\w+:\s*new class extends Relic \{/)) {
            items.push(currentItem);
        }
        currentItem = '';
    }
}

const categorizedItemCode = {
    starter: [],
    common: [],
    uncommon: [],
    rare: [],
    boss: [],
    shop: [],
    event: [],
    special: []
};

items.forEach(itemStr => {
    // Find the rarity from the constructor
    // e.g. super('id', 'name', 'desc', 'rarity')
    // We can match "super(..., ..., ..., 'rarity'"
    const match = itemStr.match(/super\([^,]+,\s*'[^']+',\s*'[^']+',\s*'([^']+)'/);
    if (!match) {
        console.warn("Could not determine rarity for item:", itemStr.split('\n')[0]);
        categorizedItemCode.special.push(itemStr);
        return;
    }
    const rarity = match[1];
    if (categorizedItemCode[rarity]) {
        categorizedItemCode[rarity].push(itemStr);
    } else {
        categorizedItemCode.special.push(itemStr);
    }
});

const imports = `import { Relic } from '../relic-class';\nimport { RoomType } from '../map-data';\nimport { CardLibrary } from '../card';\n\n`;

for (const [category, itemArray] of Object.entries(categorizedItemCode)) {
    if (itemArray.length === 0) continue;
    const itemsJoined = itemArray.join('').replace(/\},\s*$/g, '}').replace(/\n\n+/g, '\n\n');
    let code = `${imports}export const ${category.charAt(0).toUpperCase() + category.slice(1)}Relics = {\n${itemsJoined}\n};\n`;
    // Fix any double commas from string replace
    code = code.replace(/\}\),\n\s*\n/g, '}),\n');
    code = code.replace(/\},\n\s*\n/g, '},\n');

    // Add comma between items inside the object
    code = code.replace(/\}\n\s+(\w+:\s*new class)/g, '},\n    $1');

    fs.writeFileSync(path.join(outDir, `${category}.ts`), code, 'utf8');
}

// Write index.ts
const indexExports = Object.keys(categorizedItemCode)
    .filter(cat => categorizedItemCode[cat].length > 0)
    .map(cat => `export { ${cat.charAt(0).toUpperCase() + cat.slice(1)}Relics } from './${cat}';`)
    .join('\n');

const mergedLibrary = `\n` +
    Object.keys(categorizedItemCode).filter(cat => categorizedItemCode[cat].length > 0).map(c => `import { ${c.charAt(0).toUpperCase() + c.slice(1)}Relics } from './${c}';`).join('\n') +
    `\n\nexport const RelicLibrary = {\n` +
    Object.keys(categorizedItemCode).filter(cat => categorizedItemCode[cat].length > 0).map(c => `    ...${c.charAt(0).toUpperCase() + c.slice(1)}Relics`).join(',\n') +
    `\n};\n`;

fs.writeFileSync(path.join(outDir, 'index.ts'), mergedLibrary, 'utf8');

// Rewrite main relic.ts
fs.writeFileSync(relicTsPath, `export * from './relic-class';\nexport { RelicLibrary } from './relics';\n`, 'utf8');

// Replace Relic import in tests/engine or main places
// Handled by user global search usually, but we should make sure other files use correct imports if needed.
// card-class.ts handles Card. relic-class.ts handles Relic.
const runCmd = `npx tsc --noEmit`;
console.log('Relics split successfully.');
