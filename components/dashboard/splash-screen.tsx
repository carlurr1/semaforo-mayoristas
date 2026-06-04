"use client"

import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface SplashScreenProps {
  progress: number
  message: string
  error?: string | null
  onRetry?: () => void
}

export function SplashScreen({ progress, message, error, onRetry }: SplashScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e1b4b]"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 h-full w-full rounded-full bg-primary/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -right-1/2 h-full w-full rounded-full bg-success/10 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative">
            <div className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden">
              <img src="/icon-512.png" alt="ETB" className="h-20 w-20 object-contain" />
            </div>
            <motion.div
              className="absolute inset-0 rounded-2xl"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(99, 102, 241, 0.4)",
                  "0 0 0 20px rgba(99, 102, 241, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Indicadores Mayoristas HDP
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-white/50 font-mono mb-8"
        >
          ETB E&G Soporte — Customer Operation Success
        </motion.p>

        {!error ? (
          <>
            {/* Progress bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-4"
            >
              <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-white to-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </motion.div>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 text-white/40 text-xs font-mono"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              {message}
            </motion.div>
          </>
        ) : (
          /* Error state */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-xl bg-danger/20 border border-danger/30 p-6 max-w-md text-center"
          >
            <p className="text-danger font-semibold mb-2">No se pudo cargar</p>
            <p className="text-sm text-white/60 mb-4">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20 transition-colors"
              >
                Reintentar
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
