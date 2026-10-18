// セグメンテーションの確信度(0..1)を不透明度(0..255)に変換する。DOM非依存。
// low〜high の間は滑らかに補間して輪郭を柔らかくする
export function maskAlpha(p: number, low: number, high: number): number {
  if (p <= low) return 0;
  if (p >= high) return 255;
  const t = (p - low) / (high - low);
  return Math.round(t * t * (3 - 2 * t) * 255);
}
