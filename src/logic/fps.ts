// FPS 計測(DOM非依存)。直近 windowMs のフレーム数から算出する
export class FpsCounter {
  private stamps: number[] = [];
  constructor(private windowMs = 1000) {}

  tick(nowMs: number): number {
    this.stamps.push(nowMs);
    const limit = nowMs - this.windowMs;
    while (this.stamps.length > 0 && this.stamps[0] < limit) this.stamps.shift();
    return this.stamps.length;
  }
}
