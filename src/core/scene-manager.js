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
            this.game.renderMap();
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
}
