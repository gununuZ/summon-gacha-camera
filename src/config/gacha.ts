// ガチャの設定(排出表・予告色の出方・演出時間)。調整はここだけで行う。
export type Omen = 'blue' | 'gold' | 'rainbow';
export type Rarity = 'SSR' | 'SR' | 'R' | 'MISS';

export const timing = {
  chargeMs: 3000, // 溜め(魔法陣の予告)
  revealMs: 4500, // 発動(演出再生)
};

export const omenStyle: Record<Omen, { label: string; color: string }> = {
  blue: { label: '青(通常)', color: '#4aa8ff' },
  gold: { label: '金(アツい)', color: '#ffd24a' },
  rainbow: { label: '虹(確定)', color: '#ffffff' }, // 虹は描画側で色相を回す
};

export interface RarityEntry {
  id: Rarity;
  label: string;
  rate: number; // 合計 1.0
  omen: Record<Omen, number>; // 予告色の出方。合計 1.0
  effects: string[]; // 演出ID(同レアリティ内は等確率)
}

export const rarities: RarityEntry[] = [
  {
    id: 'SSR', label: 'SSR', rate: 0.03,
    omen: { blue: 0.05, gold: 0.3, rainbow: 0.65 }, // 青5%=逆転(指示書の本文と表の矛盾を調整した値)
    effects: ['dragon'],
  },
  {
    id: 'SR', label: 'SR', rate: 0.12,
    omen: { blue: 0.4, gold: 0.6, rainbow: 0 },
    effects: ['fire', 'thunder'],
  },
  {
    id: 'R', label: 'R', rate: 0.35,
    omen: { blue: 0.9, gold: 0.1, rainbow: 0 },
    effects: ['confetti', 'glow'],
  },
  {
    id: 'MISS', label: 'ハズレ', rate: 0.5,
    // 金・虹はフェイク演出になる
    omen: { blue: 0.75, gold: 0.2, rainbow: 0.05 },
    effects: ['smoke', 'pigeon', 'slime', 'oji', 'dim'],
  },
];

// 隠しポーズ専用の結果(通常抽選には出ない)
export const hiddenResults = {
  chant: { rarity: 'SSR' as Rarity, effect: 'true_summon', omen: 'rainbow' as Omen },
  cross: { rarity: 'MISS' as Rarity, effect: 'pigeon_swarm', omen: 'blue' as Omen },
};

// 演出IDの表示名(結果表示用)
export const effectNames: Record<string, string> = {
  dragon: 'ドラゴンの降臨', fire: '炎のオーラ', thunder: '雷のオーラ',
  confetti: '紙吹雪と星空', glow: 'うっすら光る',
  smoke: '煙がぽふっ', pigeon: 'ハト', slime: '小さなスライム',
  oji: '普通のおじさん', dim: 'ちょっと暗くなった',
  true_summon: '真・召喚', pigeon_swarm: 'ハト大量発生',
};

// 隠しポーズの判定しきい値。長さはすべて「肩幅」を1とした相対値(体格・距離に依存しない)
export const poses = {
  detectIntervalMs: 60, // 推論の最短間隔(端末が重いときは上げる)
  holdMs: 500, // キープ時間
  graceMs: 200, // 検出の途切れを許す時間(ブレ対策)
  minVisibility: 0.5, // 関節の信頼度の下限
  minShoulderWidth: 0.08, // 画面幅比。これ未満は遠すぎて判定しない
  chant: { wristAboveNoseSw: 0.15 }, // 両手首が鼻よりこれ以上上
  cross: {
    minWristGapSw: 0.15, // 手首同士がこれ以上離れている(手を合わせただけを除外)
    aboveShoulderSw: 0.6, // 肩の高さからこれ以上上は不可
    belowShoulderSw: 1.4, // 肩の高さからこれ以上下は不可
    outsideShoulderSw: 0.4, // 肩幅の外側にこれ以上はみ出さない
  },
};
