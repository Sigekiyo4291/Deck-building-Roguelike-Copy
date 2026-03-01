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
    let content = fs.readFileSync(fullPath, 'utf8');

    // Fix double commas
    content = content.replace(/\}\),\s*,\s*\n/g, '}),\n');
    content = content.replace(/\}\),\s*,/g, '}),');

    // Ensure the array/object ends properly
    // The last block might be `}),` but it's an object so trailing comma is fine.

    fs.writeFileSync(fullPath, content, 'utf8');
});

console.log('Commas fixed.');
