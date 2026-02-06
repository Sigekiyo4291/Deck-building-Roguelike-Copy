import { defineConfig } from 'vite';

export default defineConfig({
    // baseを './' に設定することで、デプロイ先のサブディレクトリ名に関わらず
    // 相対パスで資産を読み込むようになります。
    base: '/Deck-building-Roguelike-Copy/',
    build: {
        outDir: 'dist',
    },
});
