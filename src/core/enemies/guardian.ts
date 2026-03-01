import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * ガーディアン
 */
export class Guardian extends Enemy {
    mode: string;             // 'offensive' | 'defensive'
    modeShiftThreshold: number;  // 次のモードシフト発動に必要なダメージ閾値
    defensiveTurns: number;   // 防御態勢中のターン数
    offensiveMoveIndex: number; // 攻撃態勢の行動インデックス（0=チャージからスタート）
    offensiveSprite: string;  // 攻撃態勢用スプライト
    defensiveSprite: string;  // 防御態勢用スプライト

    constructor() {
        super('ガーディアン', 240, 'assets/images/enemies/Guardian.png');
        this.mode = 'offensive';
        this.modeShiftThreshold = 30;
        this.defensiveTurns = 0;
        this.offensiveMoveIndex = 0;
        this.offensiveSprite = 'assets/images/enemies/Guardian.png';
        this.defensiveSprite = 'assets/images/enemies/GuardianDefense.png';
    }

    // 戦闘開始時: チャージを使用し、モードシフトを付与
    onBattleStart(player, engine) {
        super.onBattleStart(player, engine);
        // モードシフト初期付与（値=閾値）
        this.addStatus('mode_shift', this.modeShiftThreshold);
        // 最初の行動インデックスはチャージ（index=1）に設定
        this.offensiveMoveIndex = 1; // チャージからスタート
    }

    // ダメージを受けるたびにモードシフト値を減少
    takeDamage(amount, source) {
        const prevHp = this.hp;
        const damage = super.takeDamage(amount, source);
        const actualLoss = prevHp - this.hp;

        if (this.mode === 'offensive' && actualLoss > 0) {
            const current = this.getStatusValue('mode_shift');
            const newVal = current - actualLoss;
            this.removeStatus('mode_shift');
            if (newVal <= 0) {
                // 閾値到達: 防御態勢へ移行
                this.changeMode('defensive');
            } else {
                this.addStatus('mode_shift', newVal);
            }
        }
        return damage;
    }

    // 態勢変更処理
    changeMode(newMode) {
        this.mode = newMode;
        if (newMode === 'defensive') {
            // 20ブロック獲得
            this.addBlock(20);
            this.defensiveTurns = 0;
            // 防御態勢の画像に切り替え
            this.sprite = this.defensiveSprite;

            // 行動を「モードシフト」に差し替え
            this.setNextMove({
                id: 'mode_shift_action',
                type: IntentType.Buff,
                name: 'モードシフト',
                effect: (self) => {
                    self.addStatus('sharp_hide', 3);
                }
            });

            console.log('Guardian shifted to Defensive Mode!');
        } else {
            // 攻撃態勢へ戻る: シャープハイドを解除
            this.removeStatus('sharp_hide');
            // 閾値を10増やしてモードシフトを再付与
            this.modeShiftThreshold += 10;
            this.addStatus('mode_shift', this.modeShiftThreshold);
            // 攻撃態勢の画像に戻す
            this.sprite = this.offensiveSprite;
            // 攻撃態勢の行動順を最初（旋風刃）にリセット
            this.offensiveMoveIndex = 0;
            console.log(`Guardian shifted to Offensive Mode! Next threshold: ${this.modeShiftThreshold}`);
        }
    }

    // プレイヤーがアタックカードを使用した際のシャープハイドダメージ
    onPlayerPlayCard(card: any, player?: any, engine?: any) {
        if (this.mode === 'defensive' && card.type === 'attack') {
            const sharpHideVal = this.getStatusValue('sharp_hide');
            if (sharpHideVal > 0) {
                console.log(`シャープハイド発動！ プレイヤーに ${sharpHideVal} ダメージ。`);
                player.takeDamage(sharpHideVal, this);
            }
        }
    }

    decideNextMove() {
        if (this.mode === 'defensive') {
            this.defensiveTurns++;
            if (this.defensiveTurns === 1) {
                // 防御態勢1ターン目: 通常攻撃9ダメージ
                this.setNextMove({
                    id: 'normal_attack',
                    type: IntentType.AttackBuff,
                    value: 9,
                    name: '攻撃',
                    effect: (self) => {
                        // シャープハイドを付与（まだ付与されていない場合）
                        if (!self.hasStatus('sharp_hide')) {
                            self.addStatus('sharp_hide', 3);
                        }
                    }
                });
            } else {
                // 防御態勢2ターン目: ツインスラム → 攻撃態勢へ移行
                this.setNextMove({
                    id: 'twin_slam',
                    type: IntentType.AttackBuff,
                    value: 8,
                    times: 2,
                    name: 'ツインスラム',
                    effect: (self) => {
                        // シャープハイド解除 → 攻撃態勢へ
                        self.changeMode('offensive');
                    }
                });
            }
            return;
        }

        // 攻撃態勢ループ: 旋風刃(0) → チャージ(1) → フィアースバッシュ(2) → 蒸気解放(3)
        const m = this.offensiveMoveIndex % 4;
        this.offensiveMoveIndex++;

        if (m === 0) {
            this.setNextMove({ id: 'whirl', type: IntentType.Attack, value: 5, times: 4, name: '旋風刃' });
        } else if (m === 1) {
            this.setNextMove({ id: 'charge', type: IntentType.Defend, name: 'チャージ', effect: (self) => self.addBlock(9) });
        } else if (m === 2) {
            this.setNextMove({ id: 'bash', type: IntentType.Attack, value: 32, name: 'フィアースバッシュ' });
        } else {
            this.setNextMove({
                id: 'vent',
                type: IntentType.Debuff,
                name: '蒸気解放',
                effect: (self, player) => {
                    player.addStatus('weak', 2);
                    player.addStatus('vulnerable', 2);
                }
            });
        }
    }
}
