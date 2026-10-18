import { describe, expect, it } from 'vitest';
import { poses } from '../src/config/gacha';
import type { Joints } from '../src/logic/pose';
import { PoseHold, detectPose } from '../src/logic/pose';

const j = (x: number, y: number, visibility = 1) => ({ x, y, visibility });

// 正面を向いた人(生の映像座標: 本人の左肩が画面右側)。肩幅 0.3、鼻 y=0.3、肩 y=0.45
function base(over: Partial<Joints> = {}): Joints {
  return {
    nose: j(0.5, 0.3),
    lShoulder: j(0.65, 0.45),
    rShoulder: j(0.35, 0.45),
    lWrist: j(0.7, 0.9), // 腕を下ろした状態
    rWrist: j(0.3, 0.9),
    ...over,
  };
}

// 左右反転した映像でも同じ結果になることを確認するためのミラー
const mirror = (a: Joints): Joints => {
  const m = (p: { x: number; y: number; visibility: number }) => ({ ...p, x: 1 - p.x });
  return { nose: m(a.nose), lShoulder: m(a.lShoulder), rShoulder: m(a.rShoulder), lWrist: m(a.lWrist), rWrist: m(a.rWrist) };
};

describe('detectPose: 天への詠唱', () => {
  const chant = base({ lWrist: j(0.7, 0.1), rWrist: j(0.3, 0.1) });
  it('両手首が鼻より上なら chant', () => {
    expect(detectPose(chant)).toBe('chant');
    expect(detectPose(mirror(chant))).toBe('chant');
  });
  it('片手だけ上げても chant にならない', () => {
    expect(detectPose(base({ lWrist: j(0.7, 0.1) }))).toBeNull();
  });
  it('手首が鼻とほぼ同じ高さでは chant にならない(余裕しきい値)', () => {
    expect(detectPose(base({ lWrist: j(0.7, 0.29), rWrist: j(0.3, 0.29) }))).toBeNull();
  });
});

describe('detectPose: 腕クロス', () => {
  // 胸の前で交差: 左手首が画面左(右肩側)へ、右手首が画面右へ
  const cross = base({ lWrist: j(0.42, 0.55), rWrist: j(0.58, 0.55) });
  it('手首が肩の高さ付近で左右入れ替わっていれば cross', () => {
    expect(detectPose(cross)).toBe('cross');
    expect(detectPose(mirror(cross))).toBe('cross');
  });
  it('腕を下ろした状態は cross にならない', () => {
    expect(detectPose(base())).toBeNull();
  });
  it('手首が入れ替わっていても低すぎれば cross にならない', () => {
    expect(detectPose(base({ lWrist: j(0.42, 0.95), rWrist: j(0.58, 0.95) }))).toBeNull();
  });
  it('手を合わせただけ(手首がほぼ同じ位置)は cross にならない', () => {
    expect(detectPose(base({ lWrist: j(0.499, 0.55), rWrist: j(0.501, 0.55) }))).toBeNull();
  });
});

describe('detectPose: 信頼度・距離', () => {
  it('関節の信頼度が低ければ判定しない', () => {
    expect(detectPose(base({ lWrist: j(0.7, 0.1, 0.1), rWrist: j(0.3, 0.1) }))).toBeNull();
  });
  it('遠すぎる(肩幅が小さい)と判定しない', () => {
    const far = base({
      lShoulder: j(0.51, 0.45), rShoulder: j(0.49, 0.45),
      lWrist: j(0.52, 0.1), rWrist: j(0.48, 0.1),
    });
    expect(detectPose(far)).toBeNull();
  });
});

describe('PoseHold', () => {
  it('holdMs 未満では確定しない', () => {
    const h = new PoseHold();
    h.update('chant', 0);
    expect(h.update('chant', poses.holdMs - 1).confirmed).toBeNull();
  });
  it('holdMs 以上キープで確定する', () => {
    const h = new PoseHold();
    h.update('chant', 0);
    expect(h.update('chant', poses.holdMs).confirmed).toBe('chant');
  });
  it('途切れが graceMs 以内なら継続する', () => {
    const h = new PoseHold();
    h.update('chant', 0);
    h.update(null, 100); // 猶予内
    h.update('chant', 200);
    expect(h.update('chant', poses.holdMs).confirmed).toBe('chant');
  });
  it('途切れが graceMs を超えるとやり直しになる', () => {
    const h = new PoseHold();
    h.update('chant', 0);
    h.update(null, poses.graceMs + 50);
    expect(h.update('chant', poses.holdMs).confirmed).toBeNull();
  });
  it('別ポーズに変わるとやり直しになる', () => {
    const h = new PoseHold();
    h.update('chant', 0);
    h.update('cross', 300);
    expect(h.update('cross', poses.holdMs).confirmed).toBeNull();
  });
});
