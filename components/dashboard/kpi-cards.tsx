'use client'

import { motion } from 'framer-motion'
import { cn, formatHMS, formatPct, formatN, sn1Status, tmsStatus, statusLabel } from '@/lib/utils'
import type { MetricasData, ClienteData } from '@/lib/gas'
import type { Status } from '@/lib/utils'

function statusColors(s: Status) {
  return {
    success: 'from-success/10 to-success/5 border-success/20',
    warning: 'from-warning/10 to-warning/5 border-warning/20',
    danger:  'from-danger/10  to-danger/5  border-danger/20',
    neutral: 'from-primary/10 to-primary/5 border-primary/20',
  }[s]
}

function statusBar(s: Status) {
  return {
    success: 'from-success to-success/40',
    warning: 'from-warning to-warning/40',
    danger:  'from-danger  to-danger/40',
    neutral: 'from-primary to-primary/40',
  }[s]
}

function statusBadge(s: Status) {
  return {
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    danger:  'bg-danger/15  text-danger  border-danger/30',
    neutral: 'bg-primary/15 text-primary border-primary/30',
  }[s]
}

function statusDot(s: Status) {
  return {
    success: 'bg-success animate-pulse',
    warning: 'bg-warning',
    danger:  'bg-danger',
    neutral: 'bg-primary',
  }[s]
}

interface KPICardProps {
  label: string
  value: string
  subtitle: string
  status: Status
  delay?: number
}

function KPICard({ label, value, subtitle, status, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-6 transition-shadow hover:shadow-xl hover:shadow-black/30',
        statusColors(status)
      )}
    >
      {/* Top bar */}
      <motion.div
        className={cn('absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r', statusBar(status))}
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
      />

      {/* Glow */}
      <div className="absolute top-0 right-0 h-28 w-28 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl pointer-events-none" />

      <div className="relative">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>

        <motion.div
          className="mt-3 font-mono text-3xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.3 }}
        >
          {value}
        </motion.div>

        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>

        <div className={cn(
          'mt-4 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold',
          statusBadge(status)
        )}>
          <span className={cn('h-1.5 w-1.5 rounded-full', statusDot(status))} />
          {statusLabel(status)}
        </div>
      </div>
    </motion.div>
  )
}

interface KPIGridProps {
  data: MetricasData
  clientes: ClienteData[]
  metaSn1: number
  metaTms: number
}

export function KPIGrid({ data, clientes, metaSn1, metaTms }: KPIGridProps) {
  const esCierre = !!(data as any).fuenteCierre || !!(data as any).mesAnio || !!(data as any).fuenteDrive

  // Recalcular KPIs con los clientes filtrados (solo cuando NO es cierre)
  let sn1_hdp = 0, sn1_n = 0, sn1s_hdp = 0, sn1s_n = 0
  let tms_sum = 0, tms_n = 0, tmss_sum = 0, tmss_n = 0

  clientes.forEach(c => {
    sn1_hdp += c.sn1_hdp; sn1_n += c.sn1_n
    sn1s_hdp += c.sn1s_hdp; sn1s_n += c.sn1s_n
    if (c.tms !== null)  { tms_sum  += c.tms  * c.casos;   tms_n  += c.casos   }
    if (c.tmss !== null) { tmss_sum += c.tmss  * c.tmss_n; tmss_n += c.tmss_n }
  })

  // Si es cierre, usar valores globales del cierre (que son los validados)
  const sn1  = esCierre ? data.sn1  : (sn1_n  > 0 ? sn1_hdp  / sn1_n  : data.sn1)
  const sn1s = esCierre ? data.sn1s : (sn1s_n > 0 ? sn1s_hdp / sn1s_n : data.sn1s)
  const tms  = esCierre ? data.tms  : (tms_n  > 0 ? tms_sum  / tms_n  : data.tms)
  const tmss = esCierre ? data.tmss : (tmss_n > 0 ? tmss_sum / tmss_n : data.tmss)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        label="SN1 Con COFO"
        value={formatPct(sn1)}
        subtitle={`${formatN(sn1_hdp || data.sn1_hdp)} HDP / ${formatN(sn1_n || data.sn1_n)} casos`}
        status={sn1Status(sn1, metaSn1)}
        delay={0}
      />
      <KPICard
        label="SN1 Sin COFO"
        value={formatPct(sn1s)}
        subtitle={`${formatN(sn1s_hdp || data.sn1s_hdp)} HDP / ${formatN(sn1s_n || data.sn1s_n)} casos`}
        status={sn1Status(sn1s, metaSn1)}
        delay={0.1}
      />
      <KPICard
        label="TMS Con COFO"
        value={formatHMS(tms)}
        subtitle={`${formatN(tms_n || data.tms_n)} casos · Meta ${metaTms}h`}
        status={tmsStatus(tms, metaTms)}
        delay={0.2}
      />
      <KPICard
        label="TMS Sin COFO"
        value={formatHMS(tmss)}
        subtitle={`${formatN(tmss_n || data.tmss_n)} casos · Meta ${metaTms}h`}
        status={tmsStatus(tmss, metaTms)}
        delay={0.3}
      />
    </div>
  )
}
