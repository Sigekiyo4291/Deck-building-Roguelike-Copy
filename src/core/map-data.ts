export class MapNode {
    id: string | number;
    layer: number;
    type: string;
    nextNodes: (string | number)[];
    isClear: boolean;
    isAvailable: boolean;

    constructor(id, layer, type) {
        this.id = id;
        this.layer = layer; // 階層 (0: スタート, 1, 2... 14: ボス)
        this.type = type;   // 'enemy', 'elite', 'rest', 'shop', 'treasure', 'boss'
        this.nextNodes = []; // 接続先のノードIDリスト
        this.isClear = false;
        this.isAvailable = false; // 現在選択可能かどうか
    }
}

export class GameMap {
    layers: MapNode[][];
    currentNode: MapNode | null;
    bossId: string | null;

    constructor() {
        this.layers = []; // 各階層のノードリストの配列 [ [node, node], [node...], ... ]
        this.currentNode = null; // 現在プレイヤーがいるノード
        this.bossId = null;
    }

    addLayer(nodes) {
        this.layers.push(nodes);
    }

    getNode(id) {
        for (const layer of this.layers) {
            for (const node of layer) {
                if (node.id === id) return node;
            }
        }
        return null;
    }

    // 次に選択可能なノードを更新
    updateAvailableNodes() {
        // 全ノードをリセット
        for (const layer of this.layers) {
            for (const node of layer) {
                node.isAvailable = false;
            }
        }

        if (!this.currentNode) {
            // スタート地点（第0層）は全て選択可能
            if (this.layers.length > 0) {
                for (const node of this.layers[0]) {
                    node.isAvailable = true;
                }
            }
        } else {
            // 通常の移動ルール
            for (const nextNodeId of this.currentNode.nextNodes) {
                const node = this.getNode(nextNodeId);
                if (node) node.isAvailable = true;
            }

            // レリック: 空飛ぶ靴 (Wing Boots)
            // main.ts などから渡される player 情報が必要だが、ここでは gameMap が player を知らないため
            // main.ts の描画ロジック側で補完するか、引数で渡す必要がある。
            // ひとまず map-data.ts 側で「全ノード開放」フラグを外から設定できるようにする
        }
    }
}
