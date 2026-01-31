import { defineConfig } from 'vite';

export default defineConfig({
    // GitHub Pagesのリポジトリ名に合わせてパスを設定します。
    base: '/Deck-building-Roguelike-Copy/',
    build: {
        outDir: 'dist',
    },
});
