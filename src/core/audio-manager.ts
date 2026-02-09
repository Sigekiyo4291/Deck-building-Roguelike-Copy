export class AudioManager {
    bgmMap: { [key: string]: HTMLAudioElement };
    seMap: { [key: string]: HTMLAudioElement };
    currentBgm: HTMLAudioElement | null;
    currentBgmType: string | null;
    bgmVolume: number = 0.2;
    seVolume: number = 0.4;
    bgmMuted: boolean = false;
    seMuted: boolean = false;

    constructor() {
        this.bgmMap = {};
        this.seMap = {};
        this.currentBgm = null;
        this.currentBgmType = null;

        // BGMロード
        this.loadBgm('map', 'assets/audio/bgm/map.mp3');
        this.loadBgm('battle', 'assets/audio/bgm/battle.mp3');
        this.loadBgm('boss', 'assets/audio/bgm/boss.mp3');

        // SEロード
        this.loadSe('attack', 'assets/audio/se/attack.mp3');
        this.loadSe('defense', 'assets/audio/se/defense.mp3');
        this.loadSe('skill', 'assets/audio/se/skill.mp3');
        this.loadSe('click', 'assets/audio/se/click.mp3'); // 任意: UI音があれば
    }

    loadBgm(key: string, path: string) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.bgmVolume;
        this.bgmMap[key] = audio;
    }

    loadSe(key: string, path: string) {
        const audio = new Audio(path);
        audio.volume = this.seVolume;
        this.seMap[key] = audio;
    }

    playBgm(type: string) {
        if (this.bgmMuted) return; // playリクエスト時点でもミュートなら再生しない

        // 同じBGMなら継続再生
        if (this.currentBgmType === type && this.currentBgm && !this.currentBgm.paused) {
            return;
        }

        this.stopBgm();

        const bgm = this.bgmMap[type];
        if (bgm) {
            bgm.currentTime = 0;
            bgm.volume = this.bgmVolume;
            bgm.play().catch(e => console.warn(`BGM play failed (${type}):`, e));
            this.currentBgm = bgm;
            this.currentBgmType = type;
        } else {
            console.warn(`BGM not found: ${type}`);
        }
    }

    stopBgm() {
        if (this.currentBgm) {
            this.currentBgm.pause();
            this.currentBgm = null;
            this.currentBgmType = null;
        }
    }

    playSe(type: string) {
        if (this.seMuted) return;

        const se = this.seMap[type];
        if (se) {
            // 重ね掛け再生 (cloneNode)
            const clone = se.cloneNode() as HTMLAudioElement;
            clone.volume = this.seVolume; // クローンにはvolumeが引き継がれない場合があるので再設定
            clone.play().catch(e => console.warn(`SE play failed (${type}):`, e));
        } else {
            console.warn(`SE not found: ${type}`);
        }
    }

    setBgmVolume(volume: number) {
        this.bgmVolume = Math.max(0, Math.min(1, volume)); // 0~1に制限
        if (this.currentBgm) {
            this.currentBgm.volume = this.bgmVolume;
        }
    }

    setSeVolume(volume: number) {
        this.seVolume = Math.max(0, Math.min(1, volume));
        // 既存のSEインスタンス（次回クローン元）の音量も更新
        Object.values(this.seMap).forEach(se => se.volume = this.seVolume);
    }

    setBgmMute(mute: boolean) {
        this.bgmMuted = mute;
        if (this.currentBgm) {
            this.currentBgm.muted = mute;
            // iOS等でpauseされる挙動を防ぐため、mutedプロパティを利用推奨
            // ただしplayBgmでのガードもあるので整合性を取る
            if (!mute && this.currentBgm.paused) {
                this.currentBgm.play().catch(e => console.warn('BGM resume failed:', e));
            }
        }
    }

    setSeMute(mute: boolean) {
        this.seMuted = mute;
    }
}
