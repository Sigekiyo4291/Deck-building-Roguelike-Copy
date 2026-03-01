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
const libraryStartIndex = source.indexOf('export const RelicLibrary = {');
if (libraryStartIndex === -1) {
    console.error("RelicLibrary not found.");
    process.exit(1);
}

const libraryStr = source.substring(libraryStartIndex);
const lines = libraryStr.split('\n');
const items = [];
let currentItem = '';
let braceCount = 0;
let inLibrary = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.includes('export const RelicLibrary = {')) {
        inLibrary = true;
        braceCount = 1; // For the Library object itself
        continue;
    }

    if (!inLibrary) continue;

    if (currentItem === '' && line.trim() === '') continue; // Skip initial empties
    if (currentItem === '' && line.trim().startsWith('//')) {
        continue; // Skip comments between items
    }

    currentItem += line + '\n';

    // Check braces within this line
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    if (braceCount === 1 && currentItem.trim().length > 0) {
        // We are back to the top level of RelicLibrary
        // The item might end with `},` or `}`
        if (currentItem.trim().match(/^\w+:\s*new class extends Relic/)) {
            // Remove trailing comma from the very end if it exists
            currentItem = currentItem.replace(/,\s*$/, '');
            items.push(currentItem);
        }
        currentItem = '';
    } else if (braceCount <= 0) {
        // We reached the end of RelicLibrary
        break;
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

    // Add comma between items
    const itemsJoined = itemArray.map(s => s.trim()).join(',\n    ');
    let code = `${imports}export const ${category.charAt(0).toUpperCase() + category.slice(1)}Relics = {\n    ${itemsJoined}\n};\n`;

    fs.writeFileSync(path.join(outDir, `${category}.ts`), code, 'utf8');
}

// Write index.ts
const mergedLibrary = Object.keys(categorizedItemCode).filter(cat => categorizedItemCode[cat].length > 0).map(c => `import { ${c.charAt(0).toUpperCase() + c.slice(1)}Relics } from './${c}';`).join('\n') +
    `\n\nexport const RelicLibrary = {\n` +
    Object.keys(categorizedItemCode).filter(cat => categorizedItemCode[cat].length > 0).map(c => `    ...${c.charAt(0).toUpperCase() + c.slice(1)}Relics`).join(',\n') +
    `\n};\n`;

fs.writeFileSync(path.join(outDir, 'index.ts'), mergedLibrary, 'utf8');

// Rewrite main relic.ts
fs.writeFileSync(relicTsPath, `export * from './relic-class';\nexport { RelicLibrary } from './relics';\n`, 'utf8');

console.log('Relics split successfully.');
