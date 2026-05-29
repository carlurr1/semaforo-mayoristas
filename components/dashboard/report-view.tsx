"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Camera, Settings, RotateCcw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ReportData {
  sn1ConCofo: number
  sn1SinCofo: number
  tmsConCofo: string
  tmsSinCofo: string
  totalCases: number
  month: string
  dateRange: string
}

interface ReportViewProps {
  data: ReportData
}

export function ReportView({ data }: ReportViewProps) {
  const [showAdjustPanel, setShowAdjustPanel] = useState(false)
  const [adjustedData, setAdjustedData] = useState<ReportData>(data)

  const resetAdjustments = () => {
    setAdjustedData(data)
  }

  const handleCapture = () => {
    // In a real app, this would use html2canvas or similar
    alert("Captura de informe iniciada...")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-foreground">Informe Semanal — Mayoristas</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {adjustedData.dateRange || "Carga un mes para generar el informe"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdjustPanel(!showAdjustPanel)}
            className={cn(
              "gap-2",
              showAdjustPanel && "bg-warning/10 border-warning/50 text-warning"
            )}
          >
            <Settings className="h-4 w-4" />
            Ajuste manual
          </Button>
          <Button onClick={handleCapture} className="gap-2">
            <Camera className="h-4 w-4" />
            Descargar imagen
          </Button>
        </div>
      </motion.div>

      {/* Adjustment Panel */}
      {showAdjustPanel && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-xl border border-warning/50 bg-warning/5 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-warning" />
            <span className="text-sm font-semibold text-warning">
              Modo ajuste — estos valores se usan solo para el informe
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                SN1 Con COFO (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={adjustedData.sn1ConCofo}
                onChange={(e) => setAdjustedData({ ...adjustedData, sn1ConCofo: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                SN1 Sin COFO (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={adjustedData.sn1SinCofo}
                onChange={(e) => setAdjustedData({ ...adjustedData, sn1SinCofo: parseFloat(e.target.value) || 0 })}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                TMS Con COFO (HH:MM:SS)
              </label>
              <Input
                type="text"
                placeholder="21:59:42"
                value={adjustedData.tmsConCofo}
                onChange={(e) => setAdjustedData({ ...adjustedData, tmsConCofo: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">
                TMS Sin COFO (HH:MM:SS)
              </label>
              <Input
                type="text"
                placeholder="08:40:50"
                value={adjustedData.tmsSinCofo}
                onChange={(e) => setAdjustedData({ ...adjustedData, tmsSinCofo: e.target.value })}
                className="font-mono"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={resetAdjustments} className="gap-2">
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar datos reales
            </Button>
            <span className="text-xs text-muted-foreground">
              TMS en formato HH:MM:SS · SN1 en porcentaje (ej: 57.7)
            </span>
          </div>
        </motion.div>
      )}

      {/* Report Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-8"
        id="report-capture"
      >
        {/* Report Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-lg shadow-primary/30">
              ETB
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Informe Semanal Mayoristas
              </h3>
              <p className="text-sm text-muted-foreground">
                Customer Operation Success · {adjustedData.month}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-primary">{adjustedData.totalCases}</div>
            <div className="text-xs text-muted-foreground">casos totales</div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* SN1 Con COFO */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              SN1 Con COFO
            </div>
            <div className={cn(
              "text-4xl font-mono font-bold mb-2",
              adjustedData.sn1ConCofo >= 85 ? "text-success" : 
              adjustedData.sn1ConCofo >= 70 ? "text-warning" : "text-danger"
            )}>
              {adjustedData.sn1ConCofo.toFixed(1)}%
            </div>
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              adjustedData.sn1ConCofo >= 85 
                ? "bg-success/20 text-success" 
                : adjustedData.sn1ConCofo >= 70 
                  ? "bg-warning/20 text-warning" 
                  : "bg-danger/20 text-danger"
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                adjustedData.sn1ConCofo >= 85 ? "bg-success" : 
                adjustedData.sn1ConCofo >= 70 ? "bg-warning" : "bg-danger"
              )} />
              {adjustedData.sn1ConCofo >= 85 ? "En objetivo" : 
               adjustedData.sn1ConCofo >= 70 ? "En seguimiento" : "Fuera de objetivo"}
            </div>
          </div>

          {/* SN1 Sin COFO */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              SN1 Sin COFO
            </div>
            <div className={cn(
              "text-4xl font-mono font-bold mb-2",
              adjustedData.sn1SinCofo >= 85 ? "text-success" : 
              adjustedData.sn1SinCofo >= 70 ? "text-warning" : "text-danger"
            )}>
              {adjustedData.sn1SinCofo.toFixed(1)}%
            </div>
            <div className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
              adjustedData.sn1SinCofo >= 85 
                ? "bg-success/20 text-success" 
                : adjustedData.sn1SinCofo >= 70 
                  ? "bg-warning/20 text-warning" 
                  : "bg-danger/20 text-danger"
            )}>
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                adjustedData.sn1SinCofo >= 85 ? "bg-success" : 
                adjustedData.sn1SinCofo >= 70 ? "bg-warning" : "bg-danger"
              )} />
              {adjustedData.sn1SinCofo >= 85 ? "En objetivo" : 
               adjustedData.sn1SinCofo >= 70 ? "En seguimiento" : "Fuera de objetivo"}
            </div>
          </div>

          {/* TMS Con COFO */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              TMS Con COFO
            </div>
            <div className="text-4xl font-mono font-bold mb-2 text-primary">
              {adjustedData.tmsConCofo}
            </div>
            <div className="text-xs text-muted-foreground">
              formato HH:MM:SS
            </div>
          </div>

          {/* TMS Sin COFO */}
          <div className="rounded-xl border border-border bg-gradient-to-br from-background to-muted/30 p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              TMS Sin COFO
            </div>
            <div className="text-4xl font-mono font-bold mb-2 text-primary">
              {adjustedData.tmsSinCofo}
            </div>
            <div className="text-xs text-muted-foreground">
              formato HH:MM:SS
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            ETB E&G Soporte · Customer Operation Success
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Generado: {new Date().toLocaleDateString("es-ES", { 
              day: "2-digit", 
              month: "short", 
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
