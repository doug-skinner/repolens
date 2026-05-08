export function byDateDesc(a: string, b: string): number {
  return new Date(b).getTime() - new Date(a).getTime();
}

export function byDateAsc(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

export function byStringAsc(a: string, b: string): number {
  return a.localeCompare(b);
}

export function byNumberDesc(a: number, b: number): number {
  return b - a;
}

export function byVersion(a: string, b: string): number {
  const parse = (t: string): [number, number, number] => {
    const m = t.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (!m) return [Infinity, Infinity, Infinity];
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  const va = parse(a);
  const vb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (va[i] !== vb[i]) return va[i] - vb[i];
  }
  return 0;
}
