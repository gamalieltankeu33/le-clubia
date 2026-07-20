import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity,
  Bot,
  Zap,
  TrendingUp,
  CheckCircle2,
  Play,
  Layers,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Cpu,
  BarChart3,
  Sliders,
  ChevronRight,
  Database,
  Globe
} from 'lucide-react'

export function AccompagnementHeroDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'pipeline'>('workflow')
  const [isRunningSim, setIsRunningSim] = useState(false)
  const [pulseCount, setPulseCount] = useState(0)

  // Auto pulsing pulse effect
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => prev + 1)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const runSimulation = () => {
    setIsRunningSim(true)
    setTimeout(() => {
      setIsRunningSim(false)
    }, 2500)
  }

  return (
    <div className="relative w-full rounded-2xl border border-zinc-200/80 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] overflow-hidden font-sans text-xs select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block" />
          </div>
          <div className="h-3.5 w-px bg-zinc-200" />
          <div className="flex items-center gap-2 bg-white border border-zinc-200/70 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-700 shadow-2xs">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>app.nextia.ai/business-os</span>
            <span className="text-zinc-400 text-[10px] ml-1">v2.4</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Système IA Actif</span>
          </div>

          <button
            onClick={runSimulation}
            disabled={isRunningSim}
            className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md text-[11px] font-medium transition-all shadow-xs active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isRunningSim ? (
              <>
                <Sparkles className="w-3 h-3 animate-spin text-blue-400" />
                <span>Exécution...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                <span>Tester le Système</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main OS Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 bg-white">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
              activeTab === 'workflow'
                ? 'bg-blue-50 text-blue-600 border border-blue-200/70'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Architecture & Workflows</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-600 border border-blue-200/70'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tableau de Pilotage</span>
          </button>

          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium text-[11px] transition-all cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-blue-50 text-blue-600 border border-blue-200/70'
                : 'text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Acquisition & Offre</span>
          </button>
        </div>

        <div className="text-[11px] text-zinc-400 font-mono">
          IA Autonomie : <span className="text-zinc-700 font-semibold">98.4%</span>
        </div>
      </div>

      {/* Main Dashboard Canvas Area */}
      <div className="p-4 bg-zinc-50/50 min-h-[360px]">
        {activeTab === 'workflow' && (
          <div className="space-y-4">
            {/* Top Engine Banner */}
            <div className="p-3 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-900 text-xs flex items-center gap-2">
                    Moteur Business IA — Accompagnement
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                      Standard Premium
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    4 Agents autonomes synchronisés • Traitement continu 24/7
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-right">
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Leads Gérés</div>
                  <div className="font-mono text-xs font-bold text-zinc-800">184 / mois</div>
                </div>
                <div className="h-6 w-px bg-zinc-200" />
                <div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Temps/Semaine</div>
                  <div className="font-mono text-xs font-bold text-emerald-600">-26 h économisées</div>
                </div>
              </div>
            </div>

            {/* Workflow Visual Nodes Canvas */}
            <div className="relative p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Node 1: Clarifier / Offre */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/80 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      01. Clarifier
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="font-semibold text-zinc-900 text-[11px] mb-1">
                    Positionnement & Offre Irrésistible
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">
                    Offre High-Ticket 2 500 € • Cible B2B validée
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-400">Statut:</span>
                    <span className="font-medium text-emerald-600">Optimum (100%)</span>
                  </div>
                </motion.div>

                {/* Node 2: Contenu IA */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`p-3 rounded-lg border relative transition-all ${
                    isRunningSim ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-400/20' : 'border-zinc-200 bg-zinc-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      02. Machine Contenu
                    </span>
                    <Bot className={`w-3.5 h-3.5 ${isRunningSim ? 'text-blue-600 animate-spin' : 'text-purple-600'}`} />
                  </div>
                  <div className="font-semibold text-zinc-900 text-[11px] mb-1">
                    Générateur d'Autorité IA
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">
                    Posts LinkedIn & Newsletters personnalisés
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-400">Rythme:</span>
                    <span className="font-mono font-medium text-zinc-800">5 posts/semaine</span>
                  </div>
                </motion.div>

                {/* Node 3: Tunnel Acquisition */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/80 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      03. Lead Capture
                    </span>
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="font-semibold text-zinc-900 text-[11px] mb-1">
                    Qualification Auto & Booking
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">
                    Formulaire SaaS Smart • Scoring prospects
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-400">Taux conversion:</span>
                    <span className="font-mono font-medium text-emerald-600">14.8%</span>
                  </div>
                </motion.div>

                {/* Node 4: Automatisations & Sales */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-3 rounded-lg border border-zinc-200 bg-zinc-50/80 relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      04. Conversion
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="font-semibold text-zinc-900 text-[11px] mb-1">
                    Appels Stratégiques & Clôture
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2">
                    Dossiers candidats automatisés
                  </p>
                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-zinc-200/60">
                    <span className="text-zinc-400">Revenus:</span>
                    <span className="font-mono font-bold text-zinc-900">12 500 € /m</span>
                  </div>
                </motion.div>
              </div>

              {/* Simulation Stream Activity log */}
              <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-2 text-zinc-600">
                  <Activity className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-mono text-[10px] text-zinc-500 truncate">
                    [19:42:08] Lead "Cabinet Conseil Lyon" qualifié → Score 96/100 (Appel réservé)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 font-medium hover:underline text-[10px]">
                  <span>Journal d'exécution</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                Chiffre d'Affaires Mensuel
              </div>
              <div className="text-xl font-bold font-mono text-zinc-900 mb-2">14 800 €</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>+38% depuis le lancement du système</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                Temps consacré par le Fondateur
              </div>
              <div className="text-xl font-bold font-mono text-zinc-900 mb-2">4.5 h / sem</div>
              <div className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>IA gère 85% des opérations</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs">
              <div className="text-zinc-400 text-[10px] font-medium uppercase tracking-wider mb-1">
                Taux de Conversion Candidats
              </div>
              <div className="text-xl font-bold font-mono text-zinc-900 mb-2">24.2%</div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Prospects hyper-qualifiés</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <span className="font-semibold text-zinc-900">Structure de l'Offre & Entonnoir</span>
              <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Offre Validée
              </span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-zinc-50">
                <span className="font-medium text-zinc-700">Positionnement :</span>
                <span className="text-zinc-600">Expertise IA & Automatisation B2B</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-50">
                <span className="font-medium text-zinc-700">Format d'Accompagnement :</span>
                <span className="text-zinc-600">Accompagnement hybride 1-on-1 + Systèmes déployés</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-zinc-50">
                <span className="font-medium text-zinc-700">Prix unitaire conseillé :</span>
                <span className="font-mono font-bold text-zinc-900">2 500 € à 5 000 €</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="px-4 py-2.5 bg-zinc-100/60 border-t border-zinc-200/60 flex items-center justify-between text-[11px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Accompagnement Le Club IA • Méthodologie & Architecture Validées</span>
        </div>
        <div className="font-mono text-[10px] text-zinc-400 hidden sm:block">
          DESIGNED FOR SCALABLE IA BUSINESSES
        </div>
      </div>
    </div>
  )
}
