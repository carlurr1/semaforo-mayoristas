// app/api/gas/route.ts
// Proxy server-side: el cliente llama /api/gas?action=...
// y este route lo redirige al GAS con el token secreto
// Así el token NUNCA sale al browser

import { NextRequest, NextResponse } from 'next/server'

const GAS_URL   = process.env.GAS_URL   || ''
const GAS_TOKEN = process.env.GAS_SECRET || ''

export async function GET(req: NextRequest) {
  if (!GAS_URL) {
    return NextResponse.json({ ok: false, error: 'GAS_URL no configurado' }, { status: 500 })
  }

  const params = new URL(req.url).searchParams
  const gasUrl = new URL(GAS_URL)

  // Pasar todos los params del cliente al GAS
  params.forEach((v, k) => gasUrl.searchParams.set(k, v))
  // Agregar el token secreto — el cliente nunca lo ve
  if (GAS_TOKEN) gasUrl.searchParams.set('token', GAS_TOKEN)

  try {
    const gasRes = await fetch(gasUrl.toString(), {
      headers: { 'Accept': 'application/json' },
    })
    const data = await gasRes.json()
    return NextResponse.json(data)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error desconocido'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
