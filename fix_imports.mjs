import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const enemiesDir = path.join(currentDir, 'src', 'core', 'enemies');
const entityPath = path.join(currentDir, 'src', 'core', 'entity.ts');
const enginePath = path.join(currentDir, 'src', 'core', 'engine.ts');

function fixImport(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');

    if (content.includes('IntentType') && !content.includes("from '../intent'") && !content.includes("from './intent'")) {
        const isEnemies = filePath.includes('enemies');
        const relativePath = isEnemies ? '../intent' : './intent';

        // Add import before the first export or class declaration
        content = `import { IntentType } from '${relativePath}';\n` + content;
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed import: ${filePath}`);
    }
}

const files = fs.readdirSync(enemiesDir);
files.forEach(file => {
    if (file.endsWith('.ts')) {
        fixImport(path.join(enemiesDir, file));
    }
});

fixImport(entityPath);
fixImport(enginePath);
