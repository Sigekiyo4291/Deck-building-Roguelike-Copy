---
trigger: always_on
---

コマンドはPowerShellのコマンドを使うようにしてください。
webでの確認はお願いしたときだけ、行ってください。

ステータス（バフ・デバフ）を追加した際は、必ず `src/core/entity.ts` の `DEBUFF_TYPES` または `BUFF_TYPES` 定数リストにも追加してください。