import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const enemiesDir = path.join(currentDir, 'src', 'core', 'enemies');
const entityPath = path.join(currentDir, 'src', 'core', 'entity.ts');
const enginePath = path.join(currentDir, 'src', 'core', 'engine.ts');

const intentRegex = /type:\s*'([^']+)'/g;

function toPascalCase(str) {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

function processFile(filePath, addImport = true) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // type: 'xxx' を IntentType.Xxxx に置換
    content = content.replace(intentRegex, (match, p1) => {
        modified = true;
        const enumName = toPascalCase(p1);
        return `type: IntentType.${enumName}`;
    });

    if (modified && addImport && !content.includes("from '../intent'") && !content.includes("from './intent'")) {
        const isEnemies = filePath.includes('enemies');
        const relativePath = isEnemies ? '../intent' : './intent';
        content = `import { IntentType } from '${relativePath}';\n` + content;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

const files = fs.readdirSync(enemiesDir);
files.forEach(file => {
    if (file.endsWith('.ts')) {
        processFile(path.join(enemiesDir, file), true);
    }
});

processFile(entityPath, true);
processFile(enginePath, true);
