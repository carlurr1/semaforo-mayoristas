/** @type {import('next').NextConfig} */
const nextConfig = {
  // Permite llamadas al GAS desde el servidor sin restricciones CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
        ],
      },
    ]
  },
}

export default nextConfig
