import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return 'text-green-600'
  if (score >= 0.6) return 'text-yellow-600'
  if (score >= 0.4) return 'text-orange-500'
  return 'text-red-500'
}

export function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 0.6) return 'default'
  if (score >= 0.4) return 'secondary'
  return 'destructive'
}
