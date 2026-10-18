/**
 * Données d'exemple déterministes.
 *
 * `Math.random` rendrait chaque rendu différent, donc chaque capture de
 * régression visuelle différente : les stories seraient ininterprétables.
 */

/** Générateur pseudo-aléatoire à graine (mulberry32). */
export function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Une forme d'onde plausible : une enveloppe, du grain, un lissage léger. */
export function peaks(seed: number, count: number): number[] {
  const rand = seeded(seed);
  const raw = Array.from({ length: count }, (_, i) => {
    const x = i / count;
    const env =
      0.35 +
      0.65 *
        Math.abs(Math.sin(x * Math.PI * 2.3 + seed)) *
        (0.6 + 0.4 * Math.sin(x * 9 + seed * 0.7));
    return Math.min(1, Math.max(0.04, env * (0.55 + 0.45 * rand())));
  });
  return raw.map((v, i) => (v * 2 + (raw[i - 1] ?? v) + (raw[i + 1] ?? v)) / 4);
}

/** Version « détruite » : silence, bruit et écho dans les zones données (fractions 0..1). */
export function destroyed(
  data: readonly number[],
  zones: readonly (readonly [number, number])[],
): number[] {
  const rand = seeded(7);
  const n = data.length;
  return data.map((v, i) => {
    const x = (i + 0.5) / n;
    const zone = zones.findIndex(([a, b]) => x >= a && x < b);
    if (zone === 0) return 0.05;
    if (zone === 1) return 0.55 + 0.45 * rand();
    if (zone === 2) return Math.max(v, 0.75 * (data[i - 14] ?? v));
    return v;
  });
}

/** Un signal d'oscilloscope : deux sinus qui battent. */
export function oscillo(count: number, t = 0): number[] {
  return Array.from({ length: count }, (_, i) => {
    const x = i / count;
    return 0.5 + 0.32 * Math.sin(x * 20 + t * 4) * Math.sin(x * 3 + t);
  });
}
