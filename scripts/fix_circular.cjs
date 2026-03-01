const fs = require('fs');
const path = require('path');

const cardTsPath = path.join(__dirname, '../src/core/card.ts');
const cardClassTsPath = path.join(__dirname, '../src/core/card-class.ts');

// 1. Move card.ts to card-class.ts
const content = fs.readFileSync(cardTsPath, 'utf8');
const newContent = content.replace(/\/\/ カードライブラリ[\s\n]*export \{ CardLibrary \} from '\.\/cards';[\s\n]*$/, '');
fs.writeFileSync(cardClassTsPath, newContent, 'utf8');

// 2. Re-create card.ts
fs.writeFileSync(cardTsPath, `export * from './card-class';\nexport { CardLibrary } from './cards';\n`, 'utf8');

// 3. Update all imports in cards/**/*.ts
const filesToFix = [
    'src/core/cards/ironclad/starter.ts',
    'src/core/cards/ironclad/attack.ts',
    'src/core/cards/ironclad/skill.ts',
    'src/core/cards/ironclad/power.ts',
    'src/core/cards/curse/curse.ts',
    'src/core/cards/status/status.ts'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) return;
    let fileContent = fs.readFileSync(fullPath, 'utf8');
    fileContent = fileContent.replace(/import\s*\{\s*Card\s*\}\s*from\s*'(\.\.\/)*card';/g, "import { Card } from '../../card-class';");
    fs.writeFileSync(fullPath, fileContent, 'utf8');
});

console.log('Circular dependency fixed.');
