const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/core/cards/ironclad/attack.ts',
    'src/core/cards/ironclad/skill.ts',
    'src/core/cards/ironclad/power.ts',
    'src/core/cards/curse/curse.ts',
    'src/core/cards/status/status.ts'
];

filesToFix.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');
    // Only add if not already there
    if (!content.includes('import { CardLibrary }')) {
        const newContent = content.replace("import { Card } from '../../card';", "import { Card } from '../../card';\nimport { CardLibrary } from '../../card';");
        fs.writeFileSync(fullPath, newContent, 'utf8');
    }
});

console.log('Imports fixed.');
