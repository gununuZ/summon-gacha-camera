// 人物マスクから輪郭点・外接矩形・頭頂を求める(DOM非依存)。座標は 0..1 に正規化
export interface SilPoint {
  x: number;
  y: number;
}

export interface SilBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SilAnalysis {
  edge: SilPoint[]; // 輪郭上のセル中心
  box: SilBox | null;
  headTop: SilPoint | null;
}

// alpha: gw*gh の 0..255。thr 以上を人物とみなす。
// 画面の端に接している側は輪郭にしない(バストアップで下端に炎が走るのを防ぐ)
export function analyzeSilhouette(alpha: ArrayLike<number>, gw: number, gh: number, thr = 128): SilAnalysis {
  const on = (x: number, y: number): boolean => alpha[y * gw + x] >= thr;
  const edge: SilPoint[] = [];
  let x0 = gw, y0 = gh, x1 = -1, y1 = -1;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (!on(x, y)) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      const open =
        (x > 0 && !on(x - 1, y)) || (x < gw - 1 && !on(x + 1, y)) || (y > 0 && !on(x, y - 1)) || (y < gh - 1 && !on(x, y + 1));
      if (open) edge.push({ x: (x + 0.5) / gw, y: (y + 0.5) / gh });
    }
  }
  if (x1 < 0) return { edge, box: null, headTop: null };

  // 頭頂: 最上段から2行分のセルの平均位置
  let sx = 0, n = 0;
  for (let y = y0; y <= Math.min(gh - 1, y0 + 1); y++) {
    for (let x = 0; x < gw; x++) if (on(x, y)) { sx += x; n++; }
  }
  return {
    edge,
    box: { x0: x0 / gw, y0: y0 / gh, x1: (x1 + 1) / gw, y1: (y1 + 1) / gh },
    headTop: { x: (sx / n + 0.5) / gw, y: y0 / gh },
  };
}

// 人物が取れないとき用の仮の上半身(頭の円+肩の楕円)。テストと、セグメンテーション失敗時の代用
export function syntheticSilhouette(): SilAnalysis {
  const edge: SilPoint[] = [];
  const ring = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): void => {
    for (let i = 0; i < n; i++) {
      const a = from + ((to - from) * i) / n;
      edge.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
    }
  };
  ring(0.5, 0.3, 0.12, 0.1, 0, Math.PI * 2, 40); // 頭
  ring(0.5, 0.78, 0.36, 0.26, Math.PI, Math.PI * 2, 50); // 肩(上半分)
  return { edge, box: { x0: 0.14, y0: 0.2, x1: 0.86, y1: 1 }, headTop: { x: 0.5, y: 0.2 } };
}
