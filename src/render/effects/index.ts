import { glowAura, confetti } from './r';
import { dim, oji, pigeon, pigeonSwarm, slime, smoke } from './miss';
import { fire, thunder } from './sr';
import { dragon, trueSummon } from './ssr';
import type { EffectFactory } from './types';

// config/gacha.ts の演出ID → 演出の作り方。新しい演出はここに足す
export const effectFactories: Record<string, EffectFactory> = {
  dragon,
  true_summon: trueSummon,
  fire,
  thunder,
  confetti,
  glow: glowAura,
  smoke,
  pigeon,
  slime,
  oji,
  dim,
  pigeon_swarm: pigeonSwarm,
};
