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
        this.hideAllScenes();
        this.elBattleScene.style.display = 'flex';
        this.elUiLayer.style.display = 'flex';
    }

    showMap() {
        this.hideAllScenes();
        this.elUiLayer.style.display = 'none'; // マップではUIを隠す
        if (this.elMapScene) {
            this.elMapScene.style.display = 'flex';
        }
    }

    showReward() {
        this.hideAllScenes();
        // リワードシーン要素を再取得（動的に追加される可能性があるため）
        if (!this.elRewardScene) this.elRewardScene = document.getElementById('reward-scene');
        if (this.elRewardScene) {
            this.elRewardScene.style.display = 'flex';
        }
    }

    showTreasure() {
        this.hideAllScenes();
        if (!this.elTreasureScene) this.elTreasureScene = document.getElementById('treasure-scene');
        if (this.elTreasureScene) {
            this.elTreasureScene.style.display = 'flex';
        }
    }

    showShop() {
        this.hideAllScenes();
        if (!this.elShopScene) this.elShopScene = document.getElementById('shop-scene');
        if (this.elShopScene) {
            this.elShopScene.style.display = 'flex';
        }
    }

    showRest() {
        this.hideAllScenes();
        if (!this.elRestScene) this.elRestScene = document.getElementById('rest-scene');
        if (this.elRestScene) {
            this.elRestScene.style.display = 'flex';
        }
    }

    showEvent() {
        this.hideAllScenes();
        if (!this.elEventScene) this.elEventScene = document.getElementById('event-scene');
        if (this.elEventScene) {
            this.elEventScene.style.display = 'flex';
        }
    }

    hideAllScenes() {
        const scenes = [
            this.elBattleScene,
            this.elMapScene,
            this.elRewardScene,
            this.elTreasureScene,
            this.elShopScene,
            this.elRestScene,
            this.elEventScene
        ];

        scenes.forEach(scene => {
            if (scene) scene.style.display = 'none';
        });

        // UIレイヤーはバトル以外では隠すのが基本だが、個別に制御
        if (this.elUiLayer) this.elUiLayer.style.display = 'none';
    }

    renderMap(map, onNodeSelect) {
        if (!this.elMapScene) return;

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

            layer.forEach(node => {
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

                nodeEl.textContent = icon;
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
            svg.setAttribute('width', mapWrapper.scrollWidth);
            svg.setAttribute('height', mapWrapper.scrollHeight);

            map.layers.forEach(layer => {
                layer.forEach(node => {
                    const startEl = nodeElements.get(node.id);
                    if (!startEl) return;
                    const startRect = startEl.getBoundingClientRect();

                    // mapWrapper基点の相対座標
                    const startX = startRect.left - wrapperRect.left + startRect.width / 2;
                    const startY = startRect.top - wrapperRect.top + startRect.height / 2;

                    node.nextNodes.forEach(nextId => {
                        const endEl = nodeElements.get(nextId);
                        if (!endEl) return;
                        const endRect = endEl.getBoundingClientRect();

                        const endX = endRect.left - wrapperRect.left + endRect.width / 2;
                        const endY = endRect.top - wrapperRect.top + endRect.height / 2;

                        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                        line.setAttribute('x1', startX);
                        line.setAttribute('y1', startY);
                        line.setAttribute('x2', endX);
                        line.setAttribute('y2', endY);
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
