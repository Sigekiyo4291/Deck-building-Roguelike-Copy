import { BOSS_DATA } from './boss-data';

export class SceneManager {
    game: any;
    elApp: HTMLElement | null;
    elBattleScene: HTMLElement | null;
    elUiLayer: HTMLElement | null;
    elMapScene: HTMLElement | null;
    elRewardScene: HTMLElement | null;
    elTreasureScene: HTMLElement | null = null;
    elShopScene: HTMLElement | null = null;
    elRestScene: HTMLElement | null = null;
    elEventScene: HTMLElement | null = null;
    elTitleScene: HTMLElement | null = null; // タイトルシーン
    elGlobalHeader: HTMLElement | null = null; // トップバー
    elRelicContainer: HTMLElement | null = null; // レリックコンテナ

    constructor(game: any) {
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
            if (this.elApp) this.elApp.appendChild(this.elMapScene);
        }

        // タイトルシーン
        this.elTitleScene = document.getElementById('title-scene');

        // グローバル要素
        this.elGlobalHeader = document.getElementById('global-header');
        this.elRelicContainer = document.getElementById('relic-container');

        // リワードシーン用のコンテナを取得
        this.elRewardScene = document.getElementById('reward-scene');
        // HTML側に追加するため、ここでは取得のみ試みる
    }

    currentScene: HTMLElement | null = null;
    isTransitioning: boolean = false;

    // シーン切り替え（フェード効果付き - 同期型クロスフェード）
    async switchScene(newScene: HTMLElement | null, showUi: boolean = false) {
        if (this.isTransitioning) return;

        if (this.currentScene === newScene && (!this.elUiLayer || (this.elUiLayer.classList.contains('active') === showUi))) {
            return;
        }

        this.isTransitioning = true;
        const oldScene = this.currentScene;

        // 1. 表示準備
        if (newScene) {
            this.hideOtherScenes(newScene, oldScene);
            newScene.style.display = 'flex';
            void newScene.offsetWidth; // Force Reflow
        }

        // 2. フェード処理開始（同時に実行）
        if (oldScene) {
            oldScene.classList.remove('active');
        }

        if (newScene) {
            newScene.classList.add('active');
        }

        // UIレイヤーの同期
        if (this.elUiLayer) {
            if (showUi) {
                this.elUiLayer.style.display = 'flex';
                void this.elUiLayer.offsetWidth; // Force Reflow
                this.elUiLayer.classList.add('active');
            } else {
                this.elUiLayer.classList.remove('active');
                // 非表示にする場合はフェード後にdisplay: none
                setTimeout(() => {
                    if (this.elUiLayer && !this.elUiLayer.classList.contains('active')) {
                        this.elUiLayer.style.display = 'none';
                    }
                }, 500);
            }
        }

        // トップバーとレリックコンテナの表示制御（タイトル画面のみ非表示）
        const isTitle = (newScene === this.elTitleScene);
        if (this.elGlobalHeader) {
            this.elGlobalHeader.style.display = isTitle ? 'none' : 'flex';
        }
        if (this.elRelicContainer) {
            this.elRelicContainer.style.display = isTitle ? 'none' : 'flex';
        }

        this.currentScene = newScene;

        // トランジション待ち
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. 古いシーンを完全非表示
        if (oldScene && oldScene !== newScene) {
            oldScene.style.display = 'none';
        }

        this.isTransitioning = false;
    }

    hideOtherScenes(scene1: HTMLElement | null, scene2: HTMLElement | null = null) {
        // 安全のために再取得
        if (!this.elBattleScene) this.elBattleScene = document.querySelector('.battle-scene');
        if (!this.elUiLayer) this.elUiLayer = document.querySelector('.ui-layer');
        if (!this.elMapScene) this.elMapScene = document.getElementById('map-scene');
        if (!this.elRewardScene) this.elRewardScene = document.getElementById('reward-scene');
        if (!this.elTreasureScene) this.elTreasureScene = document.getElementById('treasure-scene');
        if (!this.elShopScene) this.elShopScene = document.getElementById('shop-scene');
        if (!this.elRestScene) this.elRestScene = document.getElementById('rest-scene');
        if (!this.elEventScene) this.elEventScene = document.getElementById('event-scene');
        if (!this.elTitleScene) this.elTitleScene = document.getElementById('title-scene'); // 追加

        const scenes = [
            this.elBattleScene,
            this.elMapScene,
            this.elRewardScene,
            this.elTreasureScene,
            this.elShopScene,
            this.elRestScene,
            this.elEventScene,
            this.elTitleScene // 追加
        ];

        scenes.forEach(scene => {
            if (scene && scene !== scene1 && scene !== scene2) {
                scene.style.display = 'none';
                scene.classList.remove('active');
            }
        });
    }

    showTitle() {
        if (!this.elTitleScene) this.elTitleScene = document.getElementById('title-scene');
        return this.switchScene(this.elTitleScene, false);
    }

    showBattle() {
        if (!this.elBattleScene) this.elBattleScene = document.querySelector('.battle-scene');
        return this.switchScene(this.elBattleScene, true);
    }

    showMap() {
        if (!this.elMapScene) this.elMapScene = document.getElementById('map-scene');
        return this.switchScene(this.elMapScene, false);
    }

    showReward() {
        if (!this.elRewardScene) this.elRewardScene = document.getElementById('reward-scene');
        return this.switchScene(this.elRewardScene, false);
    }

    showTreasure() {
        if (!this.elTreasureScene) this.elTreasureScene = document.getElementById('treasure-scene');
        return this.switchScene(this.elTreasureScene, false);
    }

    showShop() {
        if (!this.elShopScene) this.elShopScene = document.getElementById('shop-scene');
        return this.switchScene(this.elShopScene, false);
    }

    showRest() {
        if (!this.elRestScene) this.elRestScene = document.getElementById('rest-scene');
        return this.switchScene(this.elRestScene, false);
    }

    showEvent() {
        if (!this.elEventScene) this.elEventScene = document.getElementById('event-scene');
        return this.switchScene(this.elEventScene, false);
    }

    // 古いメソッドは廃止するか、後方互換のために残すなら以下のようにする
    /*
    hideAllScenes() {
        this.hideOtherScenes(null);
        if (this.elUiLayer) this.elUiLayer.style.display = 'none';
    }
    */

    renderMapLegend() {
        if (!this.elMapScene) return;

        // 既に存在する場合は再作成しない
        if (this.elMapScene.querySelector('.map-legend')) return;

        const legendEl = document.createElement('div');
        legendEl.className = 'map-legend';
        legendEl.innerHTML = `
            <div class="legend-item"><span class="legend-icon enemy">⚔️</span> 敵</div>
            <div class="legend-item"><span class="legend-icon elite">👿</span> エリート</div>
            <div class="legend-item"><span class="legend-icon boss">👑</span> ボス</div>
            <div class="legend-item"><span class="legend-icon shop">💰</span> 商人</div>
            <div class="legend-item"><span class="legend-icon rest">🔥</span> 休憩</div>
            <div class="legend-item"><span class="legend-icon treasure">💎</span> 宝箱</div>
            <div class="legend-item"><span class="legend-icon event">❔</span> イベント</div>
        `;

        this.elMapScene.appendChild(legendEl);
    }

    renderMap(map: any, onNodeSelect: any) {
        if (!this.elMapScene) return;

        this.renderMapLegend(); // 凡例を表示

        const container = document.getElementById('map-container');
        if (!container) return;

        container.innerHTML = '';
        // 相対配置の基準にするためstyleを設定
        container.style.position = 'relative';

        const mapWrapper = document.createElement('div');
        mapWrapper.style.display = 'flex';
        mapWrapper.style.flexDirection = 'column'; // 標準の方向に変更
        mapWrapper.style.alignItems = 'center';
        mapWrapper.style.gap = '60px'; // 縦の間隔を少し広げる
        mapWrapper.style.padding = '50px';
        mapWrapper.style.position = 'relative';
        mapWrapper.style.zIndex = '2';

        // パス描画用のSVG (mapWrapper内へ移動)
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'map-paths-svg');
        svg.setAttribute('id', 'map-svg');
        mapWrapper.appendChild(svg);

        const nodeElements = new Map();

        // 階層を逆順に処理（上がボス、下がスタートになるように）
        [...map.layers].reverse().forEach(layer => {
            const layerEl = document.createElement('div');
            layerEl.style.display = 'flex';
            layerEl.style.gap = '80px'; // 横の間隔
            layerEl.style.justifyContent = 'center';
            layerEl.style.position = 'relative';
            layerEl.style.zIndex = '3'; // ノードをSVGより前に

            layer.forEach((node: any) => {
                const nodeEl = document.createElement('div');
                nodeEl.className = 'map-node ' + node.type;
                nodeEl.setAttribute('data-id', node.id); // デバッグ用
                if (node.isClear) nodeEl.classList.add('cleared');
                if (node.isAvailable) nodeEl.classList.add('available');

                let icon = '❓';
                if (node.type === 'enemy') icon = '⚔️';
                else if (node.type === 'elite') icon = '👿';
                else if (node.type === 'boss') icon = '👑';
                else if (node.type === 'rest') icon = '🔥';
                else if (node.type === 'shop') icon = '💰';
                else if (node.type === 'treasure') icon = '💎';
                else if (node.type === 'event') icon = '❔';

                if (node.type === 'boss') {
                    const bossData = map.bossId ? BOSS_DATA[map.bossId] : null;
                    if (bossData) {
                        const img = document.createElement('img');
                        img.src = bossData.image;
                        nodeEl.innerHTML = '';
                        nodeEl.appendChild(img);
                    } else {
                        nodeEl.textContent = '👑';
                    }
                } else {
                    nodeEl.textContent = icon;
                }

                nodeEl.onclick = () => {
                    if (node.isAvailable) onNodeSelect(node);
                };

                layerEl.appendChild(nodeEl);
                nodeElements.set(node.id, nodeEl);
            });

            mapWrapper.appendChild(layerEl);
        });

        container.appendChild(mapWrapper);

        // DOM描画後にパスを引く (setTimeoutで座標確定を待つ)
        setTimeout(() => {
            const wrapperRect = mapWrapper.getBoundingClientRect();

            // SVGのサイズをmapWrapperに合わせる
            svg.setAttribute('width', String(mapWrapper.scrollWidth));
            svg.setAttribute('height', String(mapWrapper.scrollHeight));

            map.layers.forEach((layer: any) => {
                layer.forEach((node: any) => {
                    const startEl = nodeElements.get(node.id);
                    if (!startEl) return;
                    const startRect = startEl.getBoundingClientRect();

                    // mapWrapper基点の相対座標
                    const startX = startRect.left - wrapperRect.left + startRect.width / 2;
                    const startY = startRect.top - wrapperRect.top + startRect.height / 2;

                    node.nextNodes.forEach((nextId: any) => {
                        const endEl = nodeElements.get(nextId);
                        if (!endEl) return;
                        const endRect = endEl.getBoundingClientRect();

                        const endX = endRect.left - wrapperRect.left + endRect.width / 2;
                        const endY = endRect.top - wrapperRect.top + endRect.height / 2;

                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', String(startX));
                        line.setAttribute('y1', String(startY));
                        line.setAttribute('x2', String(endX));
                        line.setAttribute('y2', String(endY));
                        line.setAttribute('class', 'map-path-line');

                        // 現在地から繋がっているパスを強調
                        if (node === map.currentNode || (!map.currentNode && node.layer === 0)) {
                            const nextNode = map.getNode(nextId);
                            if (nextNode && nextNode.isAvailable) {
                                line.classList.add('available');
                            }
                        }

                        svg.appendChild(line);
                    });
                });
            });

            // 描画完了後に適切な位置へスクロール
            if (!map.currentNode) {
                // 初回（現在地なし）は一番下へ
                container.scrollTop = container.scrollHeight;
            } else {
                // 現在地のノードが中央に来るように
                const currentRelEl = nodeElements.get(map.currentNode.id);
                if (currentRelEl) {
                    const rect = currentRelEl.getBoundingClientRect();
                    // offsetTop の合算で親要素（layerEl）からの相対位置を解決
                    const absoluteOffsetTop = currentRelEl.offsetTop + currentRelEl.offsetParent.offsetTop;
                    const targetScrollTop = absoluteOffsetTop - container.clientHeight / 2 + rect.height / 2;
                    container.scrollTop = targetScrollTop;
                }
            }
        }, 0);
    }
}
