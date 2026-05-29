'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn, formatHMS } from '@/lib/utils'
import type { BDRecord } from '@/lib/gas'

interface DatabaseTableProps {
  records: BDRecord[]
}

export function DatabaseTable({ records }: DatabaseTableProps) {
  const [search,        setSearch]        = useState('')
  const [serviceFilter, setServiceFilter] = useState<string | null>(null)
  const [massiveFilter, setMassiveFilter] = useState<boolean | null>(null)
  const [cofoFilter,    setCofoFilter]    = useState<boolean | null>(null)
  const [hdpFilter,     setHdpFilter]     = useState<boolean | null>(null)

  const filtered = records.filter(r => {
    if (search) {
      const q = search.toLowerCase()
      if (!(r.caso + r.cliente + r.nit + r.propietario + r.n4 + r.n5).toLowerCase().includes(q)) return false
    }
    if (serviceFilter && r.servicio !== serviceFilter) return false
    if (massiveFilter !== null && !!r.masivo !== massiveFilter) return false
    if (cofoFilter    !== null && r.cofoSN1 !== cofoFilter) return false
    if (hdpFilter     !== null && r.hdp     !== hdpFilter) return false
    return true
  })

  const reset = () => { setSearch(''); setServiceFilter(null); setMassiveFilter(null); setCofoFilter(null); setHdpFilter(null) }
  const hasFilters = !!(search || serviceFilter || massiveFilter !== null || cofoFilter !== null || hdpFilter !== null)

  const MAX = 500
  const shown = filtered.slice(0, MAX)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-4 py-4">

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-foreground mr-auto">
            {filtered.length} de {records.length} casos
          </span>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar caso, cliente, NIT..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-60 pl-9 bg-background"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {serviceFilter || 'Servicio'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setServiceFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter('Avanzado')}>Avanzado</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter('Basico')}>Basico</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Masivo {massiveFilter !== null && <span className="rounded-full bg-primary/20 px-1.5 text-[10px] text-primary">{massiveFilter ? 'Sí' : 'No'}</span>}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setMassiveFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(true)}>Con masivo</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(false)}>Sin masivo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                COFO {cofoFilter !== null && <span className="rounded-full bg-primary/20 px-1.5 text-[10px] text-primary">{cofoFilter ? 'Sí' : 'No'}</span>}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCofoFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(true)}>Con COFO</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(false)}>Sin COFO</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                {hdpFilter === null ? 'HDP/Esc' : hdpFilter ? 'HDP' : 'Escalado'}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setHdpFilter(null)}>Todos</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHdpFilter(true)}>HDP</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setHdpFilter(false)}>Escalado</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && <Button variant="ghost" size="sm" onClick={reset}>Limpiar</Button>}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted">
                {['Caso SF','Id Legado','Cliente','Servicio','Cierre','TMS','Área Sol.','N4','Masivo','COFO','SN1','Propietario'].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <motion.tr
                  key={r.caso || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: i * 0.005 }}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-primary">{r.caso || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{r.idLegado || '—'}</td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-sm font-medium truncate">{r.cliente}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{r.nit}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      r.servicio === 'Avanzado' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {r.servicio}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-mono text-muted-foreground">{r.cierre?.slice(5) || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-mono font-semibold">{formatHMS(r.tms)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{r.areaSol || '—'}</td>
                  <td className="px-4 py-3 max-w-[120px]">
                    <p className="text-[10px] truncate text-muted-foreground" title={r.n4}>{r.n4 || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      r.masivo ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground')}>
                      {r.masivo ? '✓' : '−'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      r.cofoSN1 ? 'bg-danger/20 text-danger' : 'bg-muted text-muted-foreground')}>
                      {r.cofoSN1 ? '✓' : '−'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn('inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]',
                      r.hdp ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger')}>
                      {r.hdp ? 'H' : 'E'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-muted-foreground max-w-[120px] truncate">{r.propietario || '—'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > MAX && (
          <p className="text-center py-3 text-xs text-muted-foreground">
            Mostrando {MAX} de {filtered.length} casos filtrados
          </p>
        )}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No se encontraron casos</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
