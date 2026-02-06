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

    constructor() {
        this.layers = []; // 各階層のノードリストの配列 [ [node, node], [node...], ... ]
        this.currentNode = null; // 現在プレイヤーがいるノード
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
            // 現在のノードから繋がっている次の階層のノードを選択可能に
            for (const nextNodeId of this.currentNode.nextNodes) {
                const node = this.getNode(nextNodeId);
                if (node) node.isAvailable = true;
            }
        }
    }
}
