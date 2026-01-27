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
    }

    showBattle() {
        this.elBattleScene.style.display = 'flex';
        this.elUiLayer.style.display = 'flex';
        this.elMapScene.style.display = 'none';
    }

    showMap() {
        this.elBattleScene.style.display = 'none';
        this.elUiLayer.style.display = 'none'; // マップでは手札などのUIは隠す
        this.elMapScene.style.display = 'flex';

        // マップ描画の更新
        this.game.renderMap();
    }
}
