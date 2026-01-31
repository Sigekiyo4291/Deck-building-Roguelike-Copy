import { defineConfig } from 'vite';

export default defineConfig({
    // GitHub Pagesでサブディレクトリ（リポジトリ名）に配置される場合に対応するため、
    // 相対パスをベースにする設定です。
    base: './',
    build: {
        outDir: 'dist',
    },
});
