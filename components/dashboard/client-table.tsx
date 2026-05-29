"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ClientData {
  id: string
  name: string
  cases: number
  tmsConCofo: number
  sn1ConCofo: number
  tmsSinCofo: number
  sn1SinCofo: number
}

interface ClientTableProps {
  data: ClientData[]
}

type SortKey = keyof Omit<ClientData, "id">
type SortDirection = "asc" | "desc"

function getStatusBadge(value: number, type: "tms" | "sn1") {
  if (type === "tms") {
    if (value <= 12) return { color: "bg-success/20 text-success border-success/30", status: "success" }
    if (value <= 24) return { color: "bg-warning/20 text-warning border-warning/30", status: "warning" }
    return { color: "bg-danger/20 text-danger border-danger/30", status: "danger" }
  } else {
    if (value >= 85) return { color: "bg-success/20 text-success border-success/30", status: "success" }
    if (value >= 70) return { color: "bg-warning/20 text-warning border-warning/30", status: "warning" }
    return { color: "bg-danger/20 text-danger border-danger/30", status: "danger" }
  }
}

export function ClientTable({ data }: ClientTableProps) {
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("cases")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const filteredData = data
    .filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      const direction = sortDirection === "asc" ? 1 : -1
      if (typeof aValue === "string" && typeof bValue === "string") {
        return aValue.localeCompare(bValue) * direction
      }
      return ((aValue as number) - (bValue as number)) * direction
    })

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="h-3 w-3 opacity-50" />
    return sortDirection === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

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
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filteredData.length} de {data.length} clientes
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {[
                { key: "name" as const, label: "Cliente", align: "left" },
                { key: "cases" as const, label: "Casos", align: "center" },
                { key: "tmsConCofo" as const, label: "TMS Con COFO", align: "center" },
                { key: "sn1ConCofo" as const, label: "SN1 Con COFO", align: "center" },
                { key: "tmsSinCofo" as const, label: "TMS Sin COFO", align: "center" },
                { key: "sn1SinCofo" as const, label: "SN1 Sin COFO", align: "center" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    "cursor-pointer select-none whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
                    col.align === "center" && "text-center",
                    col.align === "left" && "text-left"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-1",
                    col.align === "center" && "justify-center"
                  )}>
                    {col.label}
                    <SortIcon column={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((client, index) => (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="border-b border-border/50 transition-colors hover:bg-muted/30"
              >
                <td className="px-4 py-3 text-sm font-medium">{client.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-mono font-semibold text-primary">
                    {client.cases}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex min-w-[70px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold",
                    getStatusBadge(client.tmsConCofo, "tms").color
                  )}>
                    {client.tmsConCofo.toFixed(1)}h
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex min-w-[70px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold",
                    getStatusBadge(client.sn1ConCofo, "sn1").color
                  )}>
                    {client.sn1ConCofo.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex min-w-[70px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold",
                    getStatusBadge(client.tmsSinCofo, "tms").color
                  )}>
                    {client.tmsSinCofo.toFixed(1)}h
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex min-w-[70px] items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold",
                    getStatusBadge(client.sn1SinCofo, "sn1").color
                  )}>
                    {client.sn1SinCofo.toFixed(1)}%
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
          <p className="text-sm">No se encontraron clientes</p>
        </div>
      )}
    </motion.div>
  )
}
