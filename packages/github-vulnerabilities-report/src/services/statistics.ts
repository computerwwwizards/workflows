export function calculateMean(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateGiniCoefficient(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const n = values.length;
  const cumulative = sorted.reduce((acc, val, i) => acc + (val * (i + 1)), 0);
  const total = sorted.reduce((sum, val) => sum + val, 0);
  return (2 * cumulative) / (n * total) - (n + 1) / n;
}