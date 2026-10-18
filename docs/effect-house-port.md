# Effect House 移植メモ(調査: 2026-10-18)

> 公式サイト(effecthouse.tiktok.com)はこの調査環境から直接開けなかった。
> 内容は検索結果に出た公式ページの記述に基づく。版によって変わるので、移植時に Effect House 内で再確認すること。

## 結論
- 方向は概ね正しい。必要な機能は Effect House に揃っている。
- ただし **Web の描画(Canvas 2D の演出)は移植できない**。移植で残るのは、ロジック・タイミング・設定値・構図。
- 最大のリスクは **性能(切り抜きが重い機能に分類)** と **輪郭に沿ったパーティクルが作れるか** の2点。どちらも未検証。

## 機能の対応表
| このプロトタイプ | Effect House 側 | 状態 |
|---|---|---|
| タップで召喚 | Screen Tap イベント(Visual Scripting) | 確認済み(公式ドキュメント) |
| 抽選(src/logic/gacha.ts) | Random ノード / TypeScript スクリプト(APJS, `@component()` + `onStart/onUpdate`) | 確認済み。API は書き換えが必要 |
| 状態遷移・タイマー | Timer ノード / スクリプト | 確認済み |
| 人物の切り抜き(MediaPipe) | Portrait Segmentation(組み込み) | 確認済み。MediaPipe は不要になる |
| 隠しポーズ(src/logic/pose.ts) | 2D Keypoint Tracker(18点、手首・肘を含む)、Full Body Keypoint Info(19点、正規化座標)、Human Pose Estimation ノード | 確認済み。しきい値の考え方は流用できる |
| 音 | Audio Player | 確認済み |
| 炎・雷などのパーティクル | パーティクルシステム | **未確認**(検索で出てこなかった) |
| 輪郭に沿ったパーティクル | 切り抜きマスクをスクリプトから読めるか | **未確認**(最大の技術リスク) |
| 画像素材(public/assets) | 2D 画像・テクスチャシーケンス | 確認済み(1画像 1MB 未満) |

## 制約
- エフェクト全体 **8MB 以下**、読み込み **4秒以内**(Effect Guidelines)
- FPS の上限は 30。切り抜き(Segmentation)は「重い機能」で、他の機能と多く組み合わせるなと明記されている(Technical Optimization)
- 性能テストまたは審査の QA で、FPS・メモリ・CPU が基準を下回ると落ちる。再申請は10回まで
- 制作は PC のデスクトップアプリ(Windows / Mac)。TikTok アプリ内の Mobile Effect Editor もあるが、どこまでできるかは未確認
- ランダム系(randomizer)は公式に一般的な種類として扱われている。ガチャ形式を禁じる記述は見つからなかった(未確認)
- 日本での利用・公開条件は未確認

## 参考(公式ページ)
- Release Notes: https://effecthouse.tiktok.com/latest/release-notes-latest
- Scripting Capability Usage Guide: https://effecthouse.tiktok.com/learn/guides/api-reference/scripting-capability-usage-guide
- Randomizer 2D: https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/randomizer-2d
- Portrait Segmentation: https://effecthouse.tiktok.com/learn/guides/technical-guides/objects/segmentation/portrait-segmentation
- 2D Keypoint Tracker: https://effecthouse.tiktok.com/learn/guides/workspace/objects/ar-tracking/2d-keypoint-tracker
- Human Pose Estimation: https://effecthouse.tiktok.com/learn/guides/visual-scripting/nodes/body/human-pose-estimation
- Audio: https://effecthouse.tiktok.com/learn/guides/audio/audio-1/
- Effect Guidelines: https://effecthouse.tiktok.com/learn/guides/publishing/effect-guidelines
- Technical Optimization: https://effecthouse.tiktok.com/learn/guides/getting-started/technical-guidelines/technical-optimization
