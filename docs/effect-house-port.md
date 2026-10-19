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

## 試作(スパイク)計画 — 2026-10-19 開始

目的: 本番を作り込む前に、Effect House でしか確かめられないリスクを潰す。

### 完了条件(3つの問いに答えが出たら終わり)
1. **性能**: 人物の切り抜き + パーティクル + 背景差し替えを同時に動かして、Effect House の「Test performance」を通るか
2. **輪郭演出**: 人物の輪郭に沿って炎などを出せるか(できない場合の代わりの見せ方も決める)
3. **ロジック**: タップ → 抽選(重みつき) → 演出の切り替え、を組めるか(Visual Scripting か TypeScript か)

### 手順
- [ ] S1. MacBook に Effect House を入れて、TikTok アカウントでログイン(内蔵カメラでプレビューできるため Mac を使う)
- [ ] S2. 新規プロジェクトに Portrait Segmentation を置き、背景を暗い画像に差し替える(見本動画で確認)
- [ ] S3. Screen Tap → Random → 2種類の表示(例: SSR / ハズレ)を切り替える
- [ ] S4. パーティクルを1つ置き、人物の周りに出せるか試す(問い2)
- [ ] S5. 「Test performance」を実行し、FPS を記録する(問い1)
- [ ] S6. 「Preview in TikTok」の QR を TikTok アプリで読み、Pixel で動作を見る

### 確認環境
- MacBook の内蔵カメラで Preview パネルに自分を映して確認する(見本動画も使える)
- 実機確認は「Preview in TikTok」の QR を TikTok アプリ内のスキャナーで読む(同じアカウントでログインが必要)

## 参考(公式ページ)
- Release Notes: https://effecthouse.tiktok.com/latest/release-notes-latest
- Scripting Capability Usage Guide: https://effecthouse.tiktok.com/learn/guides/api-reference/scripting-capability-usage-guide
- Randomizer 2D: https://effecthouse.tiktok.com/learn/guides/tutorials/template-tutorials/randomizer-2d
- Portrait Segmentation: https://effecthouse.tiktok.com/learn/guides/technical-guides/objects/segmentation/portrait-segmentation
- 2D Keypoint Tracker: https://effecthouse.tiktok.com/learn/guides/workspace/objects/ar-tracking/2d-keypoint-tracker
- Human Pose Estimation: https://effecthouse.tiktok.com/learn/guides/visual-scripting/nodes/body/human-pose-estimation
- Audio: https://effecthouse.tiktok.com/learn/guides/audio/audio-1/
- Preview in Effect House: https://effecthouse.tiktok.com/learn/guides/publishing/preview/preview-in-effect-house
- Effect Guidelines: https://effecthouse.tiktok.com/learn/guides/publishing/effect-guidelines
- Technical Optimization: https://effecthouse.tiktok.com/learn/guides/getting-started/technical-guidelines/technical-optimization
