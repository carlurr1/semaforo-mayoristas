import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formatea horas decimales a HH:MM:SS
export function formatHMS(h: number): string {
  if (!h || isNaN(h)) return '00:00:00'
  const hh = Math.floor(h)
  const mm = Math.floor((h - hh) * 60)
  const ss = Math.floor(((h - hh) * 60 - mm) * 60)
  return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`
}

// Formatea porcentaje
export function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

// Formatea número con separadores
export function formatN(v: number): string {
  return v.toLocaleString('es-CO')
}

// Estado semáforo
export type Status = 'success' | 'warning' | 'danger' | 'neutral'

export function sn1Status(v: number | null, meta = 0.70): Status {
  if (v === null) return 'neutral'
  if (v >= meta) return 'success'
  if (v >= meta * 0.97) return 'warning'
  return 'danger'
}

export function tmsStatus(v: number | null, meta = 11.5): Status {
  if (v === null) return 'neutral'
  if (v <= meta) return 'success'
  if (v <= meta * 1.1) return 'warning'
  return 'danger'
}

export function statusLabel(s: Status): string {
  return { success: 'En objetivo', warning: 'En seguimiento', danger: 'Fuera del objetivo', neutral: '—' }[s]
}

// Mes label
export function mesLabel(mesAnio: string): string {
  const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const [y, m] = mesAnio.split('-')
  return `${meses[parseInt(m)]} ${y}`
}

// Mes actual YYYY-MM
export function mesActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
}
