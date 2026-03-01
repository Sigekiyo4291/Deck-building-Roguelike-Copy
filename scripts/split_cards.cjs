const fs = require('fs');
const path = require('path');

const cardTsPath = path.join(__dirname, '../src/core/card.ts');
const ironcladDir = path.join(__dirname, '../src/core/cards/ironclad');
const curseDir = path.join(__dirname, '../src/core/cards/curse');
const statusDir = path.join(__dirname, '../src/core/cards/status');

const content = fs.readFileSync(cardTsPath, 'utf8');

const lines = content.split('\n');

let inLibrary = false;
let currentCard = null;
let currentBlock = [];
let braceCount = 0;

const cards = {
    attack: [],
    skill: [],
    power: [],
    curse: [],
    status: [],
    other: []
};

let beforeLibrary = [];
let afterLibrary = [];

const starterKeys = ['STRIKE', 'DEFEND', 'BASH'];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inLibrary) {
        if (line.includes('export const CardLibrary = {')) {
            inLibrary = true;
        } else {
            beforeLibrary.push(line);
        }
        continue;
    }

    // Inside library
    if (currentCard === null) {
        const match = line.match(/^    ([A-Z0-9_]+):\s*new Card\(\{/);
        if (match) {
            currentCard = match[1];
            currentBlock = [line];
            braceCount = 1; // For the '{' in 'new Card({'
            // Check if there are any other braces on this line
            const restOfLine = line.substring(match[0].length);
            for (let char of restOfLine) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
        } else if (line.trim() === '};' || line.trim() === '}') {
            inLibrary = false;
            afterLibrary.push(line); // We won't strictly need this if we rewrite it completely, but good to have
        } else {
            // Comments or empty lines between cards can be ignored or collected
        }
    } else {
        currentBlock.push(line);
        for (let j = 0; j < line.length; j++) {
            if (line[j] === '{') braceCount++;
            if (line[j] === '}') braceCount--;
        }

        if (braceCount === 0) {
            // End of card block
            const blockStr = currentBlock.join('\n');

            if (!starterKeys.includes(currentCard)) {
                if (blockStr.includes("isStatus: true") || currentCard === 'DAZED' || currentCard === 'WOUND' || currentCard === 'BURN' || currentCard === 'SLIME') {
                    cards.status.push(blockStr);
                } else if (blockStr.includes("type: 'curse'")) {
                    cards.curse.push(blockStr);
                } else if (blockStr.includes("type: 'attack'")) {
                    cards.attack.push(blockStr);
                } else if (blockStr.includes("type: 'skill'")) {
                    cards.skill.push(blockStr);
                } else if (blockStr.includes("type: 'power'")) {
                    cards.power.push(blockStr);
                } else {
                    cards.other.push(blockStr);
                }
            }

            currentCard = null;
            currentBlock = [];
        }
    }
}

function writeCategoryFile(filePath, categoryCards, categoryObjName, imports = "import { Card } from '../../card';") {
    if (categoryCards.length === 0) return;

    let out = `${imports}\n\n`;
    out += `export const ${categoryObjName} = {\n`;
    out += categoryCards.join(',\n\n');
    out += `\n};\n`;

    fs.writeFileSync(filePath, out, 'utf8');
}

writeCategoryFile(path.join(ironcladDir, 'attack.ts'), cards.attack, 'ironcladAttackCards');
writeCategoryFile(path.join(ironcladDir, 'skill.ts'), cards.skill, 'ironcladSkillCards');
writeCategoryFile(path.join(ironcladDir, 'power.ts'), cards.power, 'ironcladPowerCards');
writeCategoryFile(path.join(curseDir, 'curse.ts'), cards.curse, 'curseCards', "import { Card } from '../../card';");
writeCategoryFile(path.join(statusDir, 'status.ts'), cards.status, 'statusCards', "import { Card } from '../../card';");

console.log('Extraction complete.');
console.log(`Attacks: ${cards.attack.length}`);
console.log(`Skills: ${cards.skill.length}`);
console.log(`Powers: ${cards.power.length}`);
console.log(`Curses: ${cards.curse.length}`);
console.log(`Statuses: ${cards.status.length}`);
console.log(`Others: ${cards.other.length}`);
