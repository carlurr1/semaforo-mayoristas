'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus } from '@/lib/utils'
import type { ClienteData } from '@/lib/gas'

interface ClientTableProps {
  clientes: ClienteData[]
  metaSn1: number
  metaTms: number
}

type SortKey = 'nombre' | 'casos' | 'tms' | 'sn1' | 'tmss' | 'sn1s'
type SortDir  = 'asc' | 'desc'

function Badge({ value, type, meta }: { value: number | null; type: 'tms' | 'sn1'; meta: number }) {
  if (value === null) return <span className="text-muted-foreground font-mono text-xs">—</span>
  const s = type === 'tms' ? tmsStatus(value, meta) : sn1Status(value, meta)
  const colors = {
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger:  'bg-danger/15  text-danger  border-danger/30',
    neutral: 'bg-muted      text-muted-foreground border-border',
  }[s]
  return (
    <span className={cn('inline-flex min-w-[76px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold', colors)}>
      {type === 'tms' ? formatHMS(value) : formatPct(value)}
    </span>
  )
}

export function ClientTable({ clientes, metaSn1, metaTms }: ClientTableProps) {
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('casos')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = clientes
    .filter(c => !search || c.nombre.toLowerCase().includes(search.toLowerCase()) || c.nit.includes(search))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const va = a[sortKey] as any
      const vb = b[sortKey] as any
      if (va === null && vb === null) return 0
      if (va === null) return 1
      if (vb === null) return -1
      if (typeof va === 'string') return va.localeCompare(vb) * dir
      return (va - vb) * dir
    })

  const cols: { key: SortKey; label: string; center?: boolean }[] = [
    { key: 'nombre', label: 'Cliente' },
    { key: 'casos',  label: 'Casos',      center: true },
    { key: 'tms',    label: 'TMS c/COFO', center: true },
    { key: 'sn1',    label: 'SN1 c/COFO', center: true },
    { key: 'tmss',   label: 'TMS s/COFO', center: true },
    { key: 'sn1s',   label: 'SN1 s/COFO', center: true },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center gap-4 border-b border-border p-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente o NIT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filtered.length} de {clientes.length} clientes
        </span>
      </div>

      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    'cursor-pointer select-none whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground',
                    col.center ? 'text-center' : 'text-left'
                  )}
                >
                  <div className={cn('flex items-center gap-1', col.center && 'justify-center')}>
                    {col.label}
                    {sortKey === col.key
                      ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <motion.tr
                key={c.nit || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.01 }}
                className="border-b border-border/50 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{c.nit}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-mono font-semibold text-primary">
                    {formatN(c.casos)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center"><Badge value={c.tms}  type="tms" meta={metaTms} /></td>
                <td className="px-4 py-3 text-center"><Badge value={c.sn1}  type="sn1" meta={metaSn1} /></td>
                <td className="px-4 py-3 text-center"><Badge value={c.tmss} type="tms" meta={metaTms} /></td>
                <td className="px-4 py-3 text-center"><Badge value={c.sn1s} type="sn1" meta={metaSn1} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Search className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No se encontraron clientes</p>
        </div>
      )}
    </motion.div>
  )
}
