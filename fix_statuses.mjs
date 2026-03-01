import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const directoryPath = join(__dirname, 'src', 'core', 'enemies');

function processFile(filePath) {
    let content = readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern for statuses: [{ id: 'xxx', value: Y }]
    let pattern1 = /, statuses: \[{ id: '(.*?)', value: (-?\d+) }\].*/g;
    content = content.replace(pattern1, (match, id, value) => {
        if (match.includes(', effect:')) {
            // effect already exists, we should probably manually check this or just strip statuses
            return match.replace(/, statuses: \[.*?\]/, '');
        }
        return `, effect: (self, player) => player.addStatus('${id}', ${value}) });`;
    });

    // Pattern for statusEffects: [{ type: 'xxx', value: Y }]
    let pattern2 = /, statusEffects: \[{ type: '(.*?)', value: (-?\d+) }\].*/g;
    content = content.replace(pattern2, (match, type, value) => {
        if (match.includes(', effect:')) {
            return match.replace(/, statusEffects: \[.*?\]/, '');
        }
        return `, effect: (self, player) => player.addStatus('${type}', ${value}) });`;
    });

    if (content !== original) {
        writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${basename(filePath)}`);
    } else {
        // Look for multi-line or arrays with more than 1 item
        if (content.includes('statuses:') || content.includes('statusEffects:')) {
            console.log(`Needs manual review: ${basename(filePath)}`);
        }
    }
}

readdirSync(directoryPath).forEach(file => {
    if (file.endsWith('.ts')) {
        processFile(join(directoryPath, file));
    }
});
