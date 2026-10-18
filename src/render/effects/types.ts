import type { SilBox, SilPoint } from '../../logic/silhouette';

// 演出に渡す情報。座標はすべて canvas のピクセル
export interface FxContext {
  w: number;
  h: number;
  t: number; // 演出の進行度 0..1
  ms: number; // 演出開始からの経過ms
  dt: number; // 前フレームからのms
  edge: SilPoint[]; // 人物の輪郭点
  box: SilBox | null; // 人物の外接矩形
  headTop: SilPoint; // 頭頂(取れなければ画面上部中央)
  anchor: SilPoint; // 魔法陣の中心
}

// back: 人物の背後に描く層(背景の差し替え、後光など)。front: 人物の前に描く層(オーラ、紙吹雪など)
export interface Effect {
  back?(ctx: CanvasRenderingContext2D, c: FxContext): void;
  front?(ctx: CanvasRenderingContext2D, c: FxContext): void;
}

export type EffectFactory = () => Effect;
