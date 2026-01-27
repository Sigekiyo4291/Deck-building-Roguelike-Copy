export class SceneManager {
    constructor(game) {
        this.game = game;
        this.elApp = document.getElementById('app');
        this.elBattleScene = document.querySelector('.battle-scene');
        this.elUiLayer = document.querySelector('.ui-layer');

        // マップシーン用のコンテナを作成（まだ存在しない場合）
        this.elMapScene = document.getElementById('map-scene');
        if (!this.elMapScene) {
            this.elMapScene = document.createElement('div');
            this.elMapScene.id = 'map-scene';
            this.elMapScene.className = 'scene';
            this.elMapScene.style.display = 'none';
            this.elApp.appendChild(this.elMapScene);
        }

        // リワードシーン用のコンテナを取得
        this.elRewardScene = document.getElementById('reward-scene');
        // HTML側に追加するため、ここでは取得のみ試みる
    }

    showBattle() {
        this.elBattleScene.style.display = 'flex';
        this.elUiLayer.style.display = 'flex';
        if (this.elMapScene) this.elMapScene.style.display = 'none';
        if (this.elRewardScene) this.elRewardScene.style.display = 'none';
    }

    showMap() {
        this.elBattleScene.style.display = 'none';
        this.elUiLayer.style.display = 'none'; // マップではUIを隠す
        if (this.elMapScene) {
            this.elMapScene.style.display = 'flex';
            // this.game.renderMap(); // Game側で制御するため削除
        }
        if (this.elRewardScene) this.elRewardScene.style.display = 'none';
    }

    showReward() {
        this.elBattleScene.style.display = 'none';
        this.elUiLayer.style.display = 'none';
        if (this.elMapScene) this.elMapScene.style.display = 'none';

        // リワードシーン要素を再取得（動的に追加される可能性があるため）
        if (!this.elRewardScene) this.elRewardScene = document.getElementById('reward-scene');

        if (this.elRewardScene) {
            this.elRewardScene.style.display = 'flex';
        }
    }

    renderMap(map, onNodeSelect) {
        if (!this.elMapScene) return;

        const container = document.getElementById('map-container');
        if (!container) return;

        container.innerHTML = '';

        const mapWrapper = document.createElement('div');
        mapWrapper.style.display = 'flex';
        mapWrapper.style.flexDirection = 'column-reverse'; // 下がスタート
        mapWrapper.style.alignItems = 'center';
        mapWrapper.style.gap = '30px';
        mapWrapper.style.padding = '50px';

        map.layers.forEach(layer => {
            const layerEl = document.createElement('div');
            layerEl.style.display = 'flex';
            layerEl.style.gap = '50px';
            layerEl.style.justifyContent = 'center';

            layer.forEach(node => {
                const nodeEl = document.createElement('div');
                nodeEl.className = 'map-node ' + node.type;
                if (node.isClear) nodeEl.classList.add('cleared');
                if (node.isAvailable) nodeEl.classList.add('available');

                // アイコン表示
                let icon = '❓';
                if (node.type === 'enemy') icon = '⚔️';
                if (node.type === 'elite') icon = '👿';
                if (node.type === 'boss') icon = '👑';
                if (node.type === 'rest') icon = '🔥';
                if (node.type === 'shop') icon = '💰';
                if (node.type === 'treasure') icon = '💎';
                if (node.type === 'event') icon = '❔';

                nodeEl.textContent = icon;

                nodeEl.onclick = () => {
                    if (node.isAvailable) {
                        onNodeSelect(node);
                    }
                };

                layerEl.appendChild(nodeEl);
            });

            mapWrapper.appendChild(layerEl);
        });

        container.appendChild(mapWrapper);
    }
}
