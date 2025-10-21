export function calculateMean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function calculateGiniCoefficient(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const n = values.length;
  const cumulative = sorted.reduce((acc, val, i) => acc + (val * (i + 1)), 0);
  const total = sorted.reduce((sum, val) => sum + val, 0);
  if (total === 0) {
    return 0;
  }
  return (2 * cumulative) / (n * total) - (n + 1) / n;
}
