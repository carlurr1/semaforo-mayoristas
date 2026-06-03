// Cliente para llamar al Google Apps Script como API REST
// La URL y el token viven en variables de entorno de Vercel

const GAS_URL  = process.env.GAS_URL  || ''   // URL del Web App de GAS
const GAS_TOKEN = process.env.GAS_SECRET || '' // Token de seguridad (mismo que pusiste en GAS)

async function gasGet(action: string, params: Record<string, string> = {}) {
  const url = new URL(GAS_URL)
  url.searchParams.set('action', action)
  if (GAS_TOKEN) url.searchParams.set('token', GAS_TOKEN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const res = await fetch(url.toString(), {
    // GAS puede tardar hasta 30s en consultar Salesforce
    next: { revalidate: 0 }, // sin caché — siempre datos frescos
  })

  if (!res.ok) throw new Error(`GAS error ${res.status}`)
  return res.json()
}

// ── Tipos ──────────────────────────────────────────────────────
export interface MetricasData {
  ok: boolean
  sn1: number; sn1s: number
  tms: number; tmss: number
  sn1_hdp: number; sn1_esc: number; sn1_n: number
  sn1s_hdp: number; sn1s_esc: number; sn1s_n: number
  tms_n: number; tmss_n: number
  totalMayoristas: number
  clientes: ClienteData[]
  serieDia: SerieDia[]
  bdRecords: BDRecord[]
}

export interface ClienteData {
  nit: string; nombre: string; servicio: string; tipo: string; celula: string
  sn1: number | null; sn1s: number | null
  tms: number | null; tmss: number | null
  casos: number
  sn1_hdp: number; sn1_esc: number; sn1_n: number
  sn1s_hdp: number; sn1s_esc: number; sn1s_n: number
  tms_n: number; tmss_n: number
}

export interface SerieDia {
  fecha: string; tms: number; tmss: number; casos: number
}

export interface BDRecord {
  caso: string; idLegado: string; nit: string; cliente: string; celula: string
  cierre: string; tms: number; areaSol: string; masivo: string
  cofoSN1: boolean; cofoTMS: boolean; hdp: boolean
  n2: string; n4: string; n5: string; causaImp: string
  propietario: string; servicio: string
  idServicio?: string
}

export interface CierreResumen {
  mesAnio: string; fechaCaptura: string
  resumen: {
    sn1: number; sn1s: number; tms: number; tmss: number
    sn1_hdp: number; sn1s_hdp: number
    sn1_n: number; sn1s_n: number
    tms_n: number; tmss_n: number
    totalMayoristas: number
  }
}

// ── Funciones de la API ────────────────────────────────────────
export async function getMetricas(mes?: string): Promise<MetricasData> {
  const params: Record<string, string> = {}
  if (mes) params.mes = mes
  return gasGet('metricas', params)
}

export async function getCierres(): Promise<{ ok: boolean; lista: CierreResumen[] }> {
  return gasGet('cierres')
}

export async function getDetalleCierre(mes: string) {
  return gasGet('cierre', { mes })
}

export async function cerrarMes(mes?: string) {
  const params: Record<string, string> = {}
  if (mes) params.mes = mes
  return gasGet('cerrarMes', params)
}

export async function cargarDesdeDrive(mes: string) {
  return gasGet('cargarDrive', { mes })
}
