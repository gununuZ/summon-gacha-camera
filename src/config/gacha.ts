// ガチャの設定。排出表・ポーズしきい値は後の段階でここに追加する
export type Omen = 'blue' | 'gold' | 'rainbow';

export const timing = {
  chargeMs: 3000, // 溜め(魔法陣の予告)
  revealMs: 4500, // 発動(演出再生)
};

export const omenStyle: Record<Omen, { label: string; color: string }> = {
  blue: { label: '青(通常)', color: '#4aa8ff' },
  gold: { label: '金(アツい)', color: '#ffd24a' },
  rainbow: { label: '虹(確定)', color: '#ffffff' }, // 虹は描画側で色相を回す
};
