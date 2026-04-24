/**
 * Epley formula — estimated one-rep max from a working set.
 * Matches every serious lifter's mental model and plots smoothly over time.
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}
