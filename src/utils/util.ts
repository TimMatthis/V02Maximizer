export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function formatPct(n: number, digits = 0) {
  return `${(n * 100).toFixed(digits)}%`
}

