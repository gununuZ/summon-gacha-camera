import { poses } from '../config/gacha';

// 隠しポーズの判定(DOM非依存)。座標は MediaPipe の正規化座標(x,y は 0..1、y は下向き)。
// 左右反転表示の影響を受けないよう、「肩との左右の並び」を基準に判定する
export type PoseId = 'chant' | 'cross';

export interface Joint {
  x: number;
  y: number;
  visibility: number;
}

export interface Joints {
  nose: Joint;
  lShoulder: Joint;
  rShoulder: Joint;
  lWrist: Joint;
  rWrist: Joint;
}

// MediaPipe Pose のランドマーク番号
const IDX = { nose: 0, lShoulder: 11, rShoulder: 12, lWrist: 15, rWrist: 16 };

export function jointsFromLandmarks(lm: ReadonlyArray<{ x: number; y: number; visibility?: number }>): Joints | null {
  const get = (i: number): Joint | null => {
    const p = lm[i];
    return p ? { x: p.x, y: p.y, visibility: p.visibility ?? 0 } : null;
  };
  const nose = get(IDX.nose);
  const lShoulder = get(IDX.lShoulder);
  const rShoulder = get(IDX.rShoulder);
  const lWrist = get(IDX.lWrist);
  const rWrist = get(IDX.rWrist);
  if (!nose || !lShoulder || !rShoulder || !lWrist || !rWrist) return null;
  return { nose, lShoulder, rShoulder, lWrist, rWrist };
}

export function detectPose(j: Joints): PoseId | null {
  const all = [j.nose, j.lShoulder, j.rShoulder, j.lWrist, j.rWrist];
  if (all.some((p) => p.visibility < poses.minVisibility)) return null;

  const sw = Math.abs(j.lShoulder.x - j.rShoulder.x); // 肩幅
  if (sw < poses.minShoulderWidth) return null;

  // 天への詠唱: 両手首が鼻より上
  const above = poses.chant.wristAboveNoseSw * sw;
  if (j.lWrist.y < j.nose.y - above && j.rWrist.y < j.nose.y - above) return 'chant';

  // 腕クロス: 手首の左右の並びが肩と逆転し、胸の前(肩の高さ付近・肩幅の内側)にある
  const c = poses.cross;
  const shoulderOrder = Math.sign(j.lShoulder.x - j.rShoulder.x);
  const wristOrder = Math.sign(j.lWrist.x - j.rWrist.x);
  const swapped = shoulderOrder * wristOrder < 0;
  const apart = Math.abs(j.lWrist.x - j.rWrist.x) >= c.minWristGapSw * sw;
  const shoulderY = (j.lShoulder.y + j.rShoulder.y) / 2;
  const minX = Math.min(j.lShoulder.x, j.rShoulder.x) - c.outsideShoulderSw * sw;
  const maxX = Math.max(j.lShoulder.x, j.rShoulder.x) + c.outsideShoulderSw * sw;
  const inChest = [j.lWrist, j.rWrist].every(
    (w) =>
      w.y >= shoulderY - c.aboveShoulderSw * sw &&
      w.y <= shoulderY + c.belowShoulderSw * sw &&
      w.x >= minX &&
      w.x <= maxX,
  );
  if (swapped && apart && inChest) return 'cross';

  return null;
}

// ポーズのキープ判定。同じポーズが holdMs 続いたら確定する。
// 検出の一時的な途切れ(null)は graceMs まで許容する
export class PoseHold {
  private candidate: PoseId | null = null;
  private since = 0;
  private lastSeen = 0;

  update(pose: PoseId | null, nowMs: number): { candidate: PoseId | null; heldMs: number; confirmed: PoseId | null } {
    if (pose !== null && pose === this.candidate) {
      this.lastSeen = nowMs;
    } else if (pose === null && this.candidate !== null && nowMs - this.lastSeen <= poses.graceMs) {
      // 途切れ猶予中: 維持
    } else {
      this.candidate = pose;
      this.since = nowMs;
      this.lastSeen = nowMs;
    }
    const heldMs = this.candidate ? nowMs - this.since : 0;
    const confirmed = this.candidate && heldMs >= poses.holdMs ? this.candidate : null;
    return { candidate: this.candidate, heldMs, confirmed };
  }

  reset(): void {
    this.candidate = null;
    this.since = 0;
    this.lastSeen = 0;
  }
}
