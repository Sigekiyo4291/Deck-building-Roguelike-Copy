import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const enemiesDir = path.join(currentDir, 'src', 'core', 'enemies');
const mainPath = path.join(currentDir, 'src', 'main.ts');

function replaceMultiWithTimes(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace 'multi: ' with 'times: '
    if (content.includes('multi: ')) {
        content = content.replace(/multi:\s*/g, 'times: ');
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Replaced in: ${filePath}`);
    }
}

const files = fs.readdirSync(enemiesDir);
files.forEach(file => {
    if (file.endsWith('.ts')) {
        replaceMultiWithTimes(path.join(enemiesDir, file));
    }
});

// src/main.ts の表示用ロジックの判定も multi -> times で統一された状態への整理を行う
let mainContent = fs.readFileSync(mainPath, 'utf-8');
if (mainContent.includes('move.multi')) {
    mainContent = mainContent.replace(/move\.times\s*\|\|\s*move\.multi/g, 'move.times');
    fs.writeFileSync(mainPath, mainContent, 'utf-8');
    console.log(`Replaced in: ${mainPath}`);
}
