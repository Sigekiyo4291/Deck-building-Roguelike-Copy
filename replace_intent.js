const fs = require('fs');
const path = require('path');

const enemiesDir = path.join(__dirname, 'src', 'core', 'enemies');
const entityPath = path.join(__dirname, 'src', 'core', 'entity.ts');
const enginePath = path.join(__dirname, 'src', 'core', 'engine.ts');
const mainPath = path.join(__dirname, 'src', 'main.ts');

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

    if (modified && addImport && !content.includes('IntentType')) {
        // '../intent' か '../../intent' かを判定
        const relativeLevel = filePath.includes('enemies') ? '../intent' : './intent';
        content = `import { IntentType } from '${relativeLevel}';\n` + content;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

// enemiesディレクトリ以下のすべてのファイルを処理
const files = fs.readdirSync(enemiesDir);
files.forEach(file => {
    if (file.endsWith('.ts')) {
        processFile(path.join(enemiesDir, file), true);
    }
});

processFile(entityPath, true);
processFile(enginePath, true);
processFile(mainPath, false); // main.tsのインポートは手動で調整する
