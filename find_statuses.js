const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src', 'core', 'enemies');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We have lines like:
    // statuses: [{ id: 'weak', value: 2 }]
    // and
    // statusEffects: [{ type: 'vulnerable', value: 1 }]
    // Some might already have an effect function:
    // effect: (self, player) => player.addStatus('vulnerable', 1)

    // A generic regex to catch simple cases:
    // , statuses: [{ id: 'xxx', value: Y }]
    // , statusEffects: [{ type: 'xxx', value: Y }]

    // Pattern for single status replacement where no effect exists
    // Warning: this is basic and will require checking if effect already exists

    // Better approach: manual fix for the few that are tricky, or 
    // just use Regex to find and we will manually fix them if needed.

    // Let's print out what we find first.
    let lines = content.split('\n');
    let modified = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line.includes('statuses:') || line.includes('statusEffects:')) {
            console.log(`Found in ${path.basename(filePath)}:${i + 1} -> ${line.trim()}`);
        }
    }
}

fs.readdirSync(directoryPath).forEach(file => {
    if (file.endsWith('.ts')) {
        processFile(path.join(directoryPath, file));
    }
});
