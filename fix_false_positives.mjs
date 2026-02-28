import fs from 'fs';
import path from 'path';

const currentDir = process.cwd();
const enemiesDir = path.join(currentDir, 'src', 'core', 'enemies');

const falsePositives = [
    'Weak', 'Vulnerable', 'EnrageEnemy', 'Burn', 'Strength', 'Dexterity', 'Entangled', 'Status', 'Curse', 'Dazed', 'Frail'
];

function fixFalsePositives(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    falsePositives.forEach(fp => {
        const regex = new RegExp(`IntentType\\.${fp}`, 'g');
        if (regex.test(content)) {
            content = content.replace(regex, `'${fp.toLowerCase()}'`);

            // Special cases for camelCase
            if (fp === 'EnrageEnemy') content = content.replace(/'enrageenemy'/, "'enrage_enemy'");
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Fixed false positives: ${filePath}`);
    }
}

const files = fs.readdirSync(enemiesDir);
files.forEach(file => {
    if (file.endsWith('.ts')) {
        fixFalsePositives(path.join(enemiesDir, file));
    }
});
