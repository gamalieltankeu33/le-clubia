import { motion } from 'framer-motion'
import {
  TrendingUp,
  Bot,
  Zap,
  CheckCircle,
  Users,
  BarChart3,
  Cpu,
  Sparkles,
  ArrowUpRight
} from 'lucide-react'

export function DashboardIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Halo lumineux subtil en arrière-plan */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-tr from-blue-600/15 via-indigo-500/15 to-violet-600/15 blur-2xl transition-all"
      />

      {/* Carte principale de l'interface SaaS */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white/90 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl"
      >
        {/* Header fenêtre macOS/SaaS */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-rose-400/80" />
            <div className="h-3 w-3 rounded-full bg-amber-400/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
            <span className="ml-2 font-mono text-[11px] font-semibold text-gray-400">
              system.clubia.app
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Système IA Actif
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="mt-5 space-y-4">
          {/* Top Stat Card */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition-all hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Croissance MFR
                </span>
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ArrowUpRight className="h-3 w-3" /> +128%
                </span>
              </div>
              <div className="mt-2 font-display text-2xl font-black text-gray-900">
                12 450 €
              </div>
              <div className="mt-1 text-[10px] text-gray-400">
                Revenus automatisés ce mois
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 transition-all hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Agents IA
                </span>
                <Bot className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="mt-2 font-display text-2xl font-black text-gray-900">
                4 Actifs
              </div>
              <div className="mt-1 text-[10px] text-emerald-600 font-medium">
                • 100% de tâches déléguées
              </div>
            </div>
          </div>

          {/* Simulated Graph & Workflow Area */}
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-bold text-gray-800">
                  Tunnel d'Acquisition & Conversions
                </span>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">
                Temps réel
              </span>
            </div>

            {/* Simulé barres de croissance */}
            <div className="mt-4 flex items-end justify-between gap-2 h-24 pt-4 px-2 border-b border-gray-100">
              {[40, 65, 45, 80, 70, 95, 110].map((height, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(height / 110) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.08 }}
                    className={`w-full rounded-t-md transition-all ${
                      i === 5 || i === 6
                        ? 'bg-gradient-to-t from-blue-600 via-indigo-600 to-violet-600 shadow-md shadow-indigo-500/20'
                        : 'bg-gray-200 group-hover:bg-gray-300'
                    }`}
                  />
                  <span className="text-[9px] text-gray-400 font-medium">
                    J{i + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
                Prospects qualifiés : <strong className="text-gray-900">142</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Appels réservés : <strong className="text-gray-900">28</strong>
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Card 1 — Haut Gauche */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-5 -left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white/95 p-3.5 shadow-xl shadow-blue-500/10 backdrop-blur-xl"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-900">
            Agent IA de Prospection
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            32 messages envoyés • 0 effort
          </div>
        </div>
      </motion.div>

      {/* Floating Card 2 — Bas Droite */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-6 -right-6 hidden sm:flex items-center gap-3 rounded-2xl border border-gray-200/90 bg-white/95 p-3.5 shadow-xl shadow-indigo-500/10 backdrop-blur-xl"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <CheckCircle className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold text-gray-900">
            Nouveau Candidat Qualifié
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            Budget : 1 500 € - 3 000 €
          </div>
        </div>
      </motion.div>
    </div>
  )
}
