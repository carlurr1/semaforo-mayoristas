"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface CaseData {
  id: string
  caseNumber: string
  legacyId: string
  client: string
  service: string
  closedDate: string
  tms: number
  solutionArea: string
  n4: string
  n5: string
  impactCause: string
  massive: boolean
  cofo: boolean
  sn1: boolean
  owner: string
}

interface DatabaseTableProps {
  data: CaseData[]
}

export function DatabaseTable({ data }: DatabaseTableProps) {
  const [search, setSearch] = useState("")
  const [serviceFilter, setServiceFilter] = useState<string | null>(null)
  const [massiveFilter, setMassiveFilter] = useState<boolean | null>(null)
  const [cofoFilter, setCofoFilter] = useState<boolean | null>(null)

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.caseNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.client.toLowerCase().includes(search.toLowerCase()) ||
      item.legacyId.toLowerCase().includes(search.toLowerCase())
    
    const matchesService = !serviceFilter || item.service === serviceFilter
    const matchesMassive = massiveFilter === null || item.massive === massiveFilter
    const matchesCofo = cofoFilter === null || item.cofo === cofoFilter

    return matchesSearch && matchesService && matchesMassive && matchesCofo
  })

  const resetFilters = () => {
    setServiceFilter(null)
    setMassiveFilter(null)
    setCofoFilter(null)
    setSearch("")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Filters Bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-foreground mr-auto">
            {filteredData.length} casos
          </span>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar caso, cliente, NIT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 bg-background"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3.5 w-3.5" />
                Servicio
                {serviceFilter && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
                    {serviceFilter}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setServiceFilter(null)}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter("Avanzado")}>
                Avanzado
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setServiceFilter("Basico")}>
                Básico
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Masivo
                {massiveFilter !== null && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
                    {massiveFilter ? "Sí" : "No"}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setMassiveFilter(null)}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(true)}>
                Con masivo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMassiveFilter(false)}>
                Sin masivo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                COFO
                {cofoFilter !== null && (
                  <span className="rounded-full bg-primary/20 px-1.5 text-xs text-primary">
                    {cofoFilter ? "Sí" : "No"}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCofoFilter(null)}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(true)}>
                Con COFO
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCofoFilter(false)}>
                Sin COFO
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {(serviceFilter || massiveFilter !== null || cofoFilter !== null || search) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-muted">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Caso SF
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Id Legado
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cliente
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Servicio
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cierre
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  TMS
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Masivo
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  COFO
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  SN1
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.01 }}
                  className="border-b border-border/50 transition-colors hover:bg-muted/30"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-primary">
                    {item.caseNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-mono text-muted-foreground">
                    {item.legacyId}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">
                    {item.client}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      item.service === "Avanzado" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.service}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground font-mono">
                    {item.closedDate}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-mono font-semibold">
                    {item.tms.toFixed(1)}h
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      item.massive 
                        ? "bg-warning/20 text-warning" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.massive ? "✓" : "−"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      item.cofo 
                        ? "bg-danger/20 text-danger" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.cofo ? "✓" : "−"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <span className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                      item.sn1 
                        ? "bg-success/20 text-success" 
                        : "bg-danger/20 text-danger"
                    )}>
                      {item.sn1 ? "✓" : "✗"}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No se encontraron casos</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}
