import { ASSETS } from './assets';

export class AssetManager {
    private static images: Map<string, HTMLImageElement> = new Map();
    private static audio: Map<string, HTMLAudioElement> = new Map();

    /**
     * 全てのアセットをプリロードする
     * @param onProgress 進捗率（0-100）を受け取るコールバック
     */
    static async preloadAll(onProgress: (percent: number) => void): Promise<void> {
        const allImagePaths = [
            ASSETS.IMAGES.PLAYER,
            ...ASSETS.IMAGES.CARDS,
            ...ASSETS.IMAGES.ENEMIES,
            ...ASSETS.IMAGES.UI,
            ...ASSETS.IMAGES.TITLE
        ];

        const allAudioPaths = [
            ...ASSETS.AUDIO.BGM,
            ...ASSETS.AUDIO.SE
        ];

        const total = allImagePaths.length + allAudioPaths.length;
        let loaded = 0;

        const increment = () => {
            loaded++;
            onProgress(Math.floor((loaded / total) * 100));
        };

        const imagePromises = allImagePaths.map(path => this.loadImage(path).then(increment));
        const audioPromises = allAudioPaths.map(path => this.loadAudio(path).then(increment));

        await Promise.all([...imagePromises, ...audioPromises]);
    }

    private static loadImage(path: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (this.images.has(path)) {
                resolve(this.images.get(path)!);
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.images.set(path, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                resolve(img); // エラーでも続行
            };
            img.src = path;
        });
    }

    private static loadAudio(path: string): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            if (this.audio.has(path)) {
                resolve(this.audio.get(path)!);
                return;
            }

            const audio = new Audio(path);
            audio.oncanplaythrough = () => {
                this.audio.set(path, audio);
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`Failed to load audio: ${path}`);
                resolve(audio); // エラーでも続行
            };
            // プリロード中であることをブラウザに伝える
            audio.load();
        });
    }

    /**
     * キャッシュされた画像を取得する
     */
    static getImage(path: string): HTMLImageElement | undefined {
        return this.images.get(path);
    }

    /**
     * キャッシュされた音声を取得する
     */
    static getAudio(path: string): HTMLAudioElement | undefined {
        return this.audio.get(path);
    }
}
