import { IntentType } from '../intent';
import { Enemy } from '../entity';

/**
 * あご虫
 */
export class JawWorm extends Enemy {
    history: any[];

    constructor() {
        super('あご虫', 40 + Math.floor(Math.random() * 5), 'assets/images/enemies/JawWorm.png');
        this.history = [];
    }

    decideNextMove() {
        const turn = this.history.length + 1;
        let move;

        if (turn === 1) {
            // 1ターン目は必ず「体当たり」
            move = this.getChompMove();
        } else {
            // 行動の選択（確率と制限）
            // Wiki: 咆哮(45%), 吸血(30%), 体当たり(25%)
            // 制限: 咆哮(2回連続不可), 体当たり(2回連続不可), 吸血(3回連続不可)

            const lastMove = this.history[this.history.length - 1];
            const secondLastMove = this.history[this.history.length - 2];

            const canBellow = lastMove !== 'bellow';
            const canChomp = lastMove !== 'chomp';
            const canThrash = !(lastMove === 'thrash' && secondLastMove === 'thrash');

            // 確率ロール
            const roll = Math.random() * 100;

            if (roll < 45) {
                move = canBellow ? this.getBellowMove() : (Math.random() < 0.5 ? this.getChompMove() : this.getThrashMove());
            } else if (roll < 45 + 30) {
                move = canThrash ? this.getThrashMove() : (Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove());
            } else {
                move = canChomp ? this.getChompMove() : (Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove());
            }

            // 制限に引っかかった場合の最終調整（2重チェック）
            if (move.id === 'bellow' && !canBellow) move = Math.random() < 0.5 ? this.getChompMove() : this.getThrashMove();
            if (move.id === 'chomp' && !canChomp) move = Math.random() < 0.5 ? this.getBellowMove() : this.getThrashMove();
            if (move.id === 'thrash' && !canThrash) move = Math.random() < 0.5 ? this.getBellowMove() : this.getChompMove();
        }

        this.history.push(move.id);
        this.setNextMove(move);
    }

    getChompMove() {
        return { id: 'chomp', type: IntentType.Attack, value: 11, name: '体当たり' };
    }

    getThrashMove() {
        return {
            id: 'thrash',
            type: IntentType.Attack,
            value: 7,
            name: '吸血', // Wiki名称に合わせる
            effect: (self) => self.addBlock(5)
        };
    }

    getBellowMove() {
        return {
            id: 'bellow',
            type: IntentType.Buff,
            name: '咆哮',
            effect: (self) => {
                self.addStatus('strength', 3);
                self.addBlock(6);
            }
        };
    }
}
