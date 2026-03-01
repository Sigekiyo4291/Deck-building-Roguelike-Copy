const fs = require('fs');
const path = require('path');

const cardTsPath = path.join(__dirname, '../src/core/card.ts');
const content = fs.readFileSync(cardTsPath, 'utf8');

const marker = '// カードライブラリ';
const markerIdx = content.indexOf(marker);

if (markerIdx !== -1) {
    const newContent = content.substring(0, markerIdx) +
        `// カードライブラリ
export { CardLibrary } from './cards';
`;
    fs.writeFileSync(cardTsPath, newContent, 'utf8');
    console.log('card.ts rewritten.');
} else {
    console.error('Marker not found.');
}
