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
    showAttackEffect(targetElement: HTMLElement, effectType = 'slash', callback: any) {
        if (!targetElement) {
            console.warn('ターゲット要素が見つかりません');
            if (callback) (callback as any)?.();
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
            if (callback) (callback as any)?.();
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
    showAttackEffectAsync(targetElement: HTMLElement, effectType = 'slash') {
        return new Promise((resolve) => {
            this.showAttackEffect(targetElement, effectType, resolve);
        });
    }

    /**
     * エフェクト要素を生成
     * @param {string} effectType - エフェクトタイプ
     * @returns {HTMLElement} エフェクト要素
     */
    createEffectElement(effectType: any) {
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
    removeEffect(effectElement: any) {
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

    /**
     * エンティティを相手方向に動かすバンプアニメーション（体当たり）を表示
     * @param {HTMLElement} element - アニメーションさせる要素
     * @param {'left' | 'right'} direction - 動く方向
     * @param {Function} callback - 完了後のコールバック
     */
    showBumpAnimation(element: HTMLElement, direction: 'left' | 'right', callback = null) {
        if (!element) {
            if (callback) (callback as any)?.();
            return;
        }

        const className = direction === 'right' ? 'bump-right' : 'bump-left';
        element.classList.add(className);

        const onEnd = () => {
            element.removeEventListener('animationend', onEnd);
            element.classList.remove(className);
            if (callback) (callback as any)?.();
        };

        element.addEventListener('animationend', onEnd);

        // フォールバック
        setTimeout(() => {
            if (element.classList.contains(className)) {
                onEnd();
            }
        }, 500);
    }

    /**
     * 投擲物エフェクトを表示（ポーション投げる演出用）
     * @param {HTMLElement} startElement - 開始位置の要素
     * @param {HTMLElement} targetElement - 目標位置の要素
     * @param {string} color - 投擲物の色 (CSS color string, default: 'white')
     * @param {Function} callback - 完了後のコールバック
     */
    showProjectileEffect(startElement: HTMLElement, targetElement: HTMLElement, color = 'white', callback = null) {
        if (!startElement || !targetElement) {
            if (callback) (callback as any)?.();
            return;
        }

        const startRect = startElement.getBoundingClientRect();
        const targetRect = targetElement.getBoundingClientRect();

        const startX = startRect.left + startRect.width / 2;
        const startY = startRect.top + startRect.height / 3; // 少し上から
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const projectile = document.createElement('div');
        projectile.className = 'projectile-effect';
        projectile.style.backgroundColor = color;
        projectile.style.left = `${startX}px`;
        projectile.style.top = `${startY}px`;

        // CSS変数として終点を渡す（CSSアニメーションで制御する場合）
        projectile.style.setProperty('--target-x', `${targetX - startX}px`);
        projectile.style.setProperty('--target-y', `${targetY - startY}px`);

        document.body.appendChild(projectile);
        this.activeEffects.push(projectile);

        // アニメーション (JSで簡易的な放物線を描く)
        const duration = 500; // ms
        const startTime = performance.now();

        const animate = (time: number) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // イージング (ease-out quad)
            // const ease = 1 - (1 - progress) * (1 - progress); 
            // 直線移動 + 高さの放物線

            const currentX = startX + (targetX - startX) * progress;
            // 高さの計算: 真ん中で一番高くなる (-100pxくらい)
            const heightOffset = Math.sin(progress * Math.PI) * -150;
            const currentY = startY + (targetY - startY) * progress + heightOffset;

            projectile.style.left = `${currentX}px`;
            projectile.style.top = `${currentY}px`;

            // 回転
            projectile.style.transform = `rotate(${progress * 720}deg)`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.removeEffect(projectile);
                if (callback) (callback as any)?.();
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 回復エフェクトを表示
     * @param {HTMLElement} targetElement - 対象の要素
     * @param {number} amount - 回復量
     * @param {Function} callback - コールバック
     */
    showHealEffect(targetElement: HTMLElement, amount: number, callback = null) {
        if (!targetElement) {
            if (callback) (callback as any)?.();
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const effectEl = document.createElement('div');
        effectEl.className = 'heal-effect-text';
        effectEl.textContent = `+${amount}`;
        effectEl.style.position = 'absolute';
        effectEl.style.left = `${rect.left + rect.width / 2}px`;
        effectEl.style.top = `${rect.top}px`;
        effectEl.style.color = '#7fff00';
        effectEl.style.fontWeight = 'bold';
        effectEl.style.fontSize = '24px';
        effectEl.style.textShadow = '0 0 5px black, 0 0 2px black';
        effectEl.style.pointerEvents = 'none';
        effectEl.style.zIndex = '1000';
        effectEl.style.transition = 'all 1s ease-out';
        effectEl.style.transform = 'translate(-50%, 0)';

        document.body.appendChild(effectEl);

        // アニメーション (上にフワッと消える)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                effectEl.style.transform = 'translate(-50%, -50px)';
                effectEl.style.opacity = '0';
            });
        });

        setTimeout(() => {
            if (effectEl.parentNode) {
                effectEl.parentNode.removeChild(effectEl);
            }
            if (callback) (callback as any)?.();
        }, 1000);
    }
}
