// エフェクト管理クラス
export class EffectManager {
    activeEffects: HTMLElement[];

    constructor() {
        this.activeEffects = [];
    }

    /**
     * 攻撃エフェクトを表示
     * @param {HTMLElement} targetElement - エフェクトを表示する対象の要素
     * @param {string} effectType - エフェクトタイプ ('slash', 'impact', etc.)
     * @param {Function} callback - エフェクト完了後のコールバック
     */
    showAttackEffect(targetElement, effectType = 'slash', callback) {
        if (!targetElement) {
            console.warn('ターゲット要素が見つかりません');
            if (callback) callback();
            return;
        }

        // エフェクト要素を作成
        const effectEl = this.createEffectElement(effectType);

        // ターゲット要素の位置を取得
        const rect = targetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // エフェクトを中央に配置
        effectEl.style.left = `${centerX}px`;
        effectEl.style.top = `${centerY}px`;

        // DOMに追加
        document.body.appendChild(effectEl);
        this.activeEffects.push(effectEl);

        // コールバックを一度だけ実行するためのラッパー
        let isCompleted = false;
        const complete = () => {
            if (isCompleted) return;
            isCompleted = true;
            this.removeEffect(effectEl);
            if (callback) callback();
        };

        // アニメーション終了後に削除
        effectEl.addEventListener('animationend', complete);

        // フォールバック: 万が一イベントが発火しない場合のためにタイムアウトを設定 (アニメーション時間+α)
        setTimeout(complete, 1000);
    }

    /**
     * 攻撃エフェクトを表示（Promise版）
     * @param {HTMLElement} targetElement - エフェクトを表示する対象の要素
     * @param {string} effectType - エフェクトタイプ ('slash', 'impact', etc.)
     * @returns {Promise} エフェクト完了時に解決されるPromise
     */
    showAttackEffectAsync(targetElement, effectType = 'slash') {
        return new Promise((resolve) => {
            this.showAttackEffect(targetElement, effectType, resolve);
        });
    }

    /**
     * エフェクト要素を生成
     * @param {string} effectType - エフェクトタイプ
     * @returns {HTMLElement} エフェクト要素
     */
    createEffectElement(effectType) {
        const effectEl = document.createElement('div');
        effectEl.className = `attack-effect ${effectType}-effect`;

        // エフェクトタイプに応じた内容を設定
        switch (effectType) {
            case 'slash':
                // 複数の斬撃ラインを作成
                for (let i = 0; i < 3; i++) {
                    const slashLine = document.createElement('div');
                    slashLine.className = 'slash-line';
                    slashLine.style.animationDelay = `${i * 0.05}s`;
                    effectEl.appendChild(slashLine);
                }

                // 飛び散る光の粒子を作成
                for (let i = 0; i < 12; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'slash-particle';
                    const angle = (360 / 12) * i;
                    particle.style.setProperty('--angle', `${angle}deg`);
                    particle.style.animationDelay = `${Math.random() * 0.1}s`;
                    effectEl.appendChild(particle);
                }
                break;
            case 'impact':
                effectEl.innerHTML = '💥';
                break;
            case 'block':
                effectEl.innerHTML = '🛡️';
                break;
            case 'skill':
                // 緑色の波紋エフェクト（CSSで制御）
                break;
            case 'power':
                // 金色のオーラと火花
                for (let i = 0; i < 8; i++) {
                    const spark = document.createElement('div');
                    spark.className = 'power-aura-spark';
                    const angle = (360 / 8) * i;
                    spark.style.setProperty('--angle', `${angle}deg`);
                    spark.style.animationDelay = `${Math.random() * 0.2}s`;
                    effectEl.appendChild(spark);
                }
                break;
            default:
                effectEl.innerHTML = '✨';
                break;
        }

        return effectEl;
    }

    /**
     * エフェクトを削除
     * @param {HTMLElement} effectElement - 削除するエフェクト要素
     */
    removeEffect(effectElement) {
        const index = this.activeEffects.indexOf(effectElement);
        if (index > -1) {
            this.activeEffects.splice(index, 1);
        }
        if (effectElement && effectElement.parentNode) {
            effectElement.parentNode.removeChild(effectElement);
        }
    }

    /**
     * すべてのエフェクトをクリア
     */
    clearAllEffects() {
        this.activeEffects.forEach(effect => {
            if (effect && effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        });
        this.activeEffects = [];
    }
}
