// 撮影の構え(画角)ごとの設定。フェーズA=バストアップ(手持ち)、フェーズB=広画角(スマホを置く)。
// 切り替えは URL の ?framing=wide、または defaultFraming を変える
export type FramingMode = 'bust' | 'wide';

export interface Framing {
  circle: 'back' | 'floor'; // 魔法陣: 人物の背後(バストアップ) / 足元(全身)
  posesEnabled: boolean; // 隠しポーズ。バストアップでは手首が映らないため無効
  hint: string; // 待機中に出す構図の案内
}

export const framings: Record<FramingMode, Framing> = {
  bust: { circle: 'back', posesEnabled: false, hint: '胸から上が映るように構えてね' },
  wide: { circle: 'floor', posesEnabled: true, hint: 'スマホを置いて、全身〜腰まで映してね' },
};

export const defaultFraming: FramingMode = 'bust';

// 人物の切り抜き(セグメンテーション)
export const segmentation = {
  intervalMs: 33, // 推論の最短間隔(端末が重いときは上げる)
  invert: false, // マスクが「背景=1」の出力だった場合に true(URL の ?maskInvert=1 でも切り替え可)
  edgeLow: 0.35, // この確信度以下は背景
  edgeHigh: 0.65, // この確信度以上は人物。間は滑らかに補間(輪郭のギザギザ対策)
};
