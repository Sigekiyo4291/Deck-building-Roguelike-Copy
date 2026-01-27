import { MapNode, GameMap } from './map-data.js';

export class MapGenerator {
    static generate(layersCount = 15) {
        const map = new GameMap();
        let nodeIdCounter = 0;

        for (let i = 0; i < layersCount; i++) {
            const layerNodes = [];
            let nodesCount;

            // 階層によるノード数の設定
            if (i === 0) nodesCount = 3; // スタートは選択肢3つ
            else if (i === layersCount - 1) nodesCount = 1; // ボスは1つ
            else nodesCount = 2 + Math.floor(Math.random() * 3); // 中間は2-4個

            for (let j = 0; j < nodesCount; j++) {
                // ノードタイプ決定
                let type = 'enemy';
                if (i === layersCount - 1) type = 'boss';
                else if (i === 0) type = 'enemy'; // 最初は雑魚敵
                else if (i % 5 === 0) type = 'treasure'; // 5階層ごとに宝箱（簡易ロジック）
                else if (Math.random() < 0.15) type = 'shop';
                else if (Math.random() < 0.15) type = 'rest';
                else if (Math.random() < 0.15) type = 'elite';
                else if (Math.random() < 0.3) type = 'event';

                const node = new MapNode(nodeIdCounter++, i, type);
                layerNodes.push(node);
            }
            map.addLayer(layerNodes);
        }

        // パスの接続（簡易版: 下の階層から上の階層へランダムに接続）
        for (let i = 0; i < layersCount - 1; i++) {
            const currentLayer = map.layers[i];
            const nextLayer = map.layers[i + 1];

            // 各ノードから少なくとも1つの次ノードへ接続
            for (const node of currentLayer) {
                // 真上、左上、右上にあるノードに接続するイメージで
                // ここでは簡易的にランダムに1-2個接続
                const connectCount = 1 + Math.floor(Math.random() * 2);
                for (let k = 0; k < connectCount; k++) {
                    const targetIndex = Math.floor(Math.random() * nextLayer.length);
                    const targetNode = nextLayer[targetIndex];
                    if (!node.nextNodes.includes(targetNode.id)) {
                        node.nextNodes.push(targetNode.id);
                    }
                }
            }

            // 次の階層の全ノードが親を持つことを保証する処理が必要だが、
            // 今回はプロトタイプなので省略（到達不能ノードが出る可能性あり）
        }

        return map;
    }
}
