import { MapNode, GameMap, RoomType } from './map-data';
import { ACT_BOSSES } from './boss-data';

export class MapGenerator {
    static generate(act = 1, layersCount = 15) {
        const map = new GameMap();
        let nodeIdCounter = 0;

        for (let i = 0; i < layersCount; i++) {
            // ... (既存のノード生成ロジックは共通)
            const layerNodes = [];
            let nodesCount;

            if (i === 0) nodesCount = 3;
            else if (i === layersCount - 1) nodesCount = 1;
            else nodesCount = 2 + Math.floor(Math.random() * 3);

            for (let j = 0; j < nodesCount; j++) {
                let type: RoomType = RoomType.ENEMY;
                if (i === layersCount - 1) type = RoomType.BOSS;
                else if (i === 0) type = RoomType.ENEMY;
                else if (i % 5 === 0) type = RoomType.TREASURE;
                else if (Math.random() < 0.15) type = RoomType.SHOP;
                else if (Math.random() < 0.15) type = RoomType.REST;
                else if (Math.random() < 0.15) type = RoomType.ELITE;
                else if (Math.random() < 0.3) type = RoomType.EVENT;

                const node = new MapNode(nodeIdCounter++, i, type);
                layerNodes.push(node);
            }
            map.addLayer(layerNodes);
        }

        // パスの接続
        for (let i = 0; i < layersCount - 1; i++) {
            const currentLayer = map.layers[i];
            const nextLayer = map.layers[i + 1];

            for (const node of currentLayer) {
                const connectCount = 1 + Math.floor(Math.random() * 2);
                for (let k = 0; k < connectCount; k++) {
                    const targetIndex = Math.floor(Math.random() * nextLayer.length);
                    const targetNode = nextLayer[targetIndex];
                    if (!node.nextNodes.includes(targetNode.id)) {
                        node.nextNodes.push(targetNode.id);
                    }
                }
            }

            for (const nextNode of nextLayer) {
                const hasParent = currentLayer.some(node => node.nextNodes.includes(nextNode.id));
                if (!hasParent) {
                    const parentNode = currentLayer[Math.floor(Math.random() * currentLayer.length)];
                    parentNode.nextNodes.push(nextNode.id);
                }
            }
        }

        // ボスの抽選 (Actに対応)
        const bosses = ACT_BOSSES[act] || ACT_BOSSES[1];
        map.bossId = bosses[Math.floor(Math.random() * bosses.length)];

        return map;
    }
}
