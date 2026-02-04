import { Config } from '../config.js';
import { CardLibrary } from './card.js';
import { RelicLibrary } from './relic.js';
import { EventLibrary } from './event-data.js';
import {
    Louse, Cultist, JawWorm, AcidSlimeM, SpikeSlimeM, AcidSlimeS, SpikeSlimeS,
    FungiBeast, AcidSlimeL, SpikeSlimeL, BlueSlaver, RedSlaver, Looter,
    GremlinNob, Lagavulin, Sentry, SlimeBoss, Guardian, Hexaghost
} from './entity.js';

export class DebugManager {
    constructor(game) {
        this.game = game;
        this.isVisible = false;

        if (this.isEnabled()) {
            this.initUI();
            console.log('Debug Mode Enabled');
        }
    }

    isEnabled() {
        return Config.DEBUG_MODE === true;
    }

    initUI() {
        // Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'debug-toggle-btn';
        toggleBtn.textContent = '🛠️ Debug';
        toggleBtn.onclick = () => this.toggleOverlay();
        document.body.appendChild(toggleBtn);

        // Overlay
        const overlay = document.createElement('div');
        overlay.id = 'debug-overlay';
        overlay.style.display = 'none';

        overlay.innerHTML = `
            <div class="debug-container">
                <div class="debug-header">
                    <h2>Debug Menu</h2>
                    <button id="debug-close-btn">Close</button>
                </div>
                <div class="debug-tabs">
                    <button class="debug-tab active" data-tab="battle">Battle</button>
                    <button class="debug-tab" data-tab="event">Event</button>
                    <button class="debug-tab" data-tab="scene">Scene</button>
                    <button class="debug-tab" data-tab="card">Card</button>
                    <button class="debug-tab" data-tab="relic">Relic</button>
                </div>
                <div class="debug-content" id="debug-content-battle" style="display: block;">
                    <h3>Start Battle</h3>
                    <div class="debug-list" id="debug-enemy-list"></div>
                    <div class="debug-actions">
                         <div id="debug-selected-enemies"></div>
                         <button id="debug-start-battle-btn" class="debug-action-btn">Start Battle</button>
                    </div>
                </div>
                <div class="debug-content" id="debug-content-event" style="display: none;">
                    <h3>Trigger Event</h3>
                    <div class="debug-list" id="debug-event-list"></div>
                </div>
                <div class="debug-content" id="debug-content-scene" style="display: none;">
                    <h3>Scene</h3>
                    <div class="debug-list" id="debug-scene-list"></div>
                </div>
                <div class="debug-content" id="debug-content-card" style="display: none;">
                    <h3>Add Card</h3>
                    <div class="debug-list" id="debug-card-list"></div>
                </div>
                <div class="debug-content" id="debug-content-relic" style="display: none;">
                    <h3>Add Relic</h3>
                    <div class="debug-list" id="debug-relic-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Bind Events
        document.getElementById('debug-close-btn').onclick = () => this.toggleOverlay();

        // Tab Switching
        const tabs = overlay.querySelectorAll('.debug-tab');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const contents = overlay.querySelectorAll('.debug-content');
                contents.forEach(c => c.style.display = 'none');

                document.getElementById(`debug-content-${tab.dataset.tab}`).style.display = 'block';
            };
        });

        this.initBattleTab();
        this.initEventTab();
        this.initSceneTab();
        this.initCardTab();
        this.initRelicTab();
    }

    toggleOverlay() {
        const overlay = document.getElementById('debug-overlay');
        this.isVisible = !this.isVisible;
        overlay.style.display = this.isVisible ? 'flex' : 'none';
    }

    // --- Battle Tab ---
    initBattleTab() {
        const enemyClasses = [
            { name: 'Louse (Red)', cls: Louse, args: ['red'] },
            { name: 'Louse (Green)', cls: Louse, args: ['green'] },
            { name: 'Cultist', cls: Cultist },
            { name: 'Jaw Worm', cls: JawWorm },
            { name: 'Acid Slime (M)', cls: AcidSlimeM },
            { name: 'Spike Slime (M)', cls: SpikeSlimeM },
            { name: 'Acid Slime (S)', cls: AcidSlimeS },
            { name: 'Spike Slime (S)', cls: SpikeSlimeS },
            { name: 'Fungi Beast', cls: FungiBeast },
            { name: 'Acid Slime (L)', cls: AcidSlimeL },
            { name: 'Spike Slime (L)', cls: SpikeSlimeL },
            { name: 'Blue Slaver', cls: BlueSlaver },
            { name: 'Red Slaver', cls: RedSlaver },
            { name: 'Looter', cls: Looter },
            { name: 'Gremlin Nob', cls: GremlinNob },
            { name: 'Lagavulin', cls: Lagavulin },
            { name: 'Sentry', cls: Sentry, args: [0] },
            { name: 'Slime Boss', cls: SlimeBoss },
            { name: 'Guardian', cls: Guardian },
            { name: 'Hexaghost', cls: Hexaghost },
        ];

        const listContainer = document.getElementById('debug-enemy-list');
        const selectedContainer = document.getElementById('debug-selected-enemies');
        let selectedEnemies = [];

        enemyClasses.forEach((enemyDef, index) => {
            const btn = document.createElement('button');
            btn.textContent = enemyDef.name;
            btn.className = 'debug-item-btn';
            btn.onclick = () => {
                selectedEnemies.push(enemyDef);
                this.updateSelectedEnemies(selectedEnemies, selectedContainer);
            };
            listContainer.appendChild(btn);
        });

        document.getElementById('debug-start-battle-btn').onclick = () => {
            if (selectedEnemies.length === 0) {
                alert('No enemies selected!');
                return;
            }
            const enemies = selectedEnemies.map(def => new def.cls(...(def.args || [])));
            this.game.startDebugBattle(enemies);
            selectedEnemies = [];
            this.updateSelectedEnemies(selectedEnemies, selectedContainer);
            this.toggleOverlay();
        };
    }

    updateSelectedEnemies(list, container) {
        container.innerHTML = 'Selected: ' + list.map(e => e.name).join(', ');
    }

    // --- Event Tab ---
    initEventTab() {
        const listContainer = document.getElementById('debug-event-list');
        Object.values(EventLibrary).forEach(event => {
            const btn = document.createElement('button');
            btn.textContent = `${event.image} ${event.name}`;
            btn.className = 'debug-item-btn';
            btn.onclick = () => {
                this.game.startDebugEvent(event);
                this.toggleOverlay();
            };
            listContainer.appendChild(btn);
        });
    }

    // --- Scene Tab ---
    initSceneTab() {
        const listContainer = document.getElementById('debug-scene-list');
        const scenes = [
            { name: '🛍️ Shop', action: () => this.game.showShopScene() },
            { name: '🔥 Rest', action: () => this.game.showRestScene() },
            { name: '🎁 Treasure', action: () => this.game.showTreasureScene() },
        ];

        scenes.forEach(scene => {
            const btn = document.createElement('button');
            btn.textContent = scene.name;
            btn.className = 'debug-item-btn';
            btn.onclick = () => {
                scene.action();
                this.toggleOverlay();
            };
            listContainer.appendChild(btn);
        });
    }

    // --- Card Tab ---
    initCardTab() {
        const listContainer = document.getElementById('debug-card-list');
        Object.values(CardLibrary).forEach(card => {
            const btn = document.createElement('button');
            btn.textContent = `[${card.cost}] ${card.name}`; // baseName might be better but name is fine
            btn.className = 'debug-item-btn ' + card.rarity;
            btn.onclick = () => {
                this.game.player.masterDeck.push(card.clone());
                alert(`Added ${card.name} to deck`);
            };
            listContainer.appendChild(btn);
        });
    }

    // --- Relic Tab ---
    initRelicTab() {
        const listContainer = document.getElementById('debug-relic-list');
        Object.values(RelicLibrary).forEach(relic => {
            const btn = document.createElement('button');
            btn.textContent = relic.name;
            btn.className = 'debug-item-btn';
            btn.onclick = () => {
                this.game.player.relics.push(relic);
                if (relic.onObtain) relic.onObtain(this.game.player);
                this.game.updateRelicUI();
                alert(`Added ${relic.name}`);
            };
            listContainer.appendChild(btn);
        });
    }
}
