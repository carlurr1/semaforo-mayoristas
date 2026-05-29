# Semáforo Mayoristas — ETB E&G Soporte

Dashboard premium en Next.js conectado a Google Apps Script como backend.

---

## Despliegue en 4 pasos

### Paso 1 — Configura el GAS

1. En Apps Script, reemplaza el `Codigo.gs` con el archivo actualizado
2. Ve a **Propiedades del script** → agrega:
   - `GAS_SECRET` = un token secreto (ej: `mi-token-super-secreto-2026`)
3. **Reimplementa** la Web App:
   - Implementar → Nueva implementación → Aplicación web
   - Ejecutar como: **Yo**
   - Acceso: **Cualquier persona**
4. Copia la URL que te da (formato `https://script.google.com/macros/s/.../exec`)

### Paso 2 — Sube el código a GitHub

```bash
cd semaforo-vercel
git init
git add .
git commit -m "Semaforo Mayoristas v2"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/semaforo-mayoristas.git
git push -u origin main
```

### Paso 3 — Despliega en Vercel

1. Ve a [vercel.com](https://vercel.com) → **New Project**
2. Importa el repositorio que acabas de crear
3. En **Environment Variables** agrega:
   - `GAS_URL` = la URL del Web App de GAS (Paso 1)
   - `GAS_SECRET` = el mismo token del Paso 1
4. Clic en **Deploy**

¡Listo! Vercel te da una URL tipo `https://semaforo-mayoristas.vercel.app`

### Paso 4 — Opcional: dominio personalizado

En Vercel → Settings → Domains → agrega `semaforo.tuempresa.com`

---

## Desarrollo local

```bash
# Instalar dependencias
pnpm install   # o npm install

# Crear variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tu GAS_URL y GAS_SECRET

# Correr en desarrollo
pnpm dev
# Abre http://localhost:3000
```

---

## Arquitectura

```
[Vercel - Next.js]
  app/page.tsx          → Dashboard principal
  app/api/gas/route.ts  → Proxy seguro al GAS (oculta el token)
  components/dashboard/ → Componentes UI
  lib/gas.ts            → Tipos y cliente del GAS
  lib/utils.ts          → Helpers (formatHMS, formatPct, etc.)

[Google Apps Script]
  Codigo.gs             → Backend: Salesforce + Sheets
  doGet()               → API REST que responde JSON
```

## Variables de entorno

| Variable     | Descripción                        |
|--------------|------------------------------------|
| `GAS_URL`    | URL del Web App de Apps Script     |
| `GAS_SECRET` | Token de seguridad (mismos en GAS) |
