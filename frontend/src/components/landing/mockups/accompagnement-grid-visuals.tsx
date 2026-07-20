import React from 'react'
import {
  Briefcase,
  Target,
  Sparkles,
  Filter,
  Layers,
  Bot,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
  Sliders,
  Cpu,
  BarChart2
} from 'lucide-react'

// 1. Offre Card Visual
export function OffreVisual() {
  return (
    <div className="p-3 rounded-lg bg-zinc-900 text-white font-sans text-xs space-y-2 border border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1.5 border-b border-zinc-800">
        <span className="font-mono text-blue-400">STRUCTURE D'OFFRE HIGH-TICKET</span>
        <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded text-[9px]">Validé</span>
      </div>
      <div className="font-semibold text-zinc-100 text-[11px]">Offre "Système IA Accompagné"</div>
      <div className="flex items-center justify-between text-[11px] bg-zinc-800/80 p-2 rounded border border-zinc-700/60">
        <span className="text-zinc-300">Prix unitaire</span>
        <span className="font-mono font-bold text-emerald-400">2 500 €</span>
      </div>
      <div className="space-y-1 text-[10px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Livrable : Architecture IA clé en main</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span>Suivi 1-on-1 & Optimisation 90 jours</span>
        </div>
      </div>
    </div>
  )
}

// 2. Positionnement Visual
export function PositionnementVisual() {
  return (
    <div className="p-3 rounded-lg bg-white text-zinc-900 font-sans text-xs space-y-2 border border-zinc-200 shadow-2xs">
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span className="font-mono text-zinc-500">MATRICE DE POSITIONNEMENT</span>
        <span className="text-emerald-600 font-semibold">Angle Unique</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="p-2 rounded bg-zinc-50 border border-zinc-100">
          <div className="text-zinc-400 text-[9px]">Marché global</div>
          <div className="font-medium text-zinc-600 line-through">Formations IA génériques</div>
        </div>
        <div className="p-2 rounded bg-blue-50/70 border border-blue-100 text-blue-900">
          <div className="text-blue-500 font-semibold text-[9px]">Votre Position</div>
          <div className="font-bold">Partenaire Systèmes IA B2B</div>
        </div>
      </div>
    </div>
  )
}

// 3. Contenu Visual
export function ContenuVisual() {
  return (
    <div className="p-3 rounded-lg bg-zinc-50 text-zinc-900 font-sans text-xs space-y-2 border border-zinc-200">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-600" />
          <span className="font-medium">Moteur de Contenu IA</span>
        </div>
        <span className="font-mono text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Autopilot</span>
      </div>
      <div className="p-2 rounded bg-white border border-zinc-200/80 space-y-1">
        <div className="text-[10px] font-semibold text-zinc-800">Post LinkedIn "Autorité IA"</div>
        <div className="text-[9px] text-zinc-500 line-clamp-2">
          "Voici exactement comment nous avons automatisé 80% des tâches répétitives de notre client..."
        </div>
      </div>
      <div className="flex items-center justify-between text-[9px] text-zinc-400 pt-1">
        <span>Généré & Planifié</span>
        <span className="text-emerald-600 font-semibold">Taux d'engagement: +240%</span>
      </div>
    </div>
  )
}

// 4. Acquisition Visual
export function AcquisitionVisual() {
  return (
    <div className="p-3 rounded-lg bg-white text-zinc-900 font-sans text-xs space-y-2 border border-zinc-200">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-mono text-zinc-400">TUNNEL QUALIFIÉ</span>
        <span className="text-blue-600 font-medium">Capture 24/7</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between p-1.5 rounded bg-zinc-50 text-[10px]">
          <span className="text-zinc-600">Formulaire Smart Qualification</span>
          <span className="font-mono font-bold text-zinc-900">72% complétion</span>
        </div>
        <div className="flex items-center justify-between p-1.5 rounded bg-blue-50 text-[10px] text-blue-900">
          <span className="font-medium">Réservation d'Appel Direct</span>
          <span className="font-mono font-bold">12 RDV / sem</span>
        </div>
      </div>
    </div>
  )
}

// 5. Système Visual
export function SystemeVisual() {
  return (
    <div className="p-3 rounded-lg bg-zinc-900 text-white font-sans text-xs space-y-2 border border-zinc-800">
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-blue-400" />
          <span>Architecture Ops</span>
        </div>
        <span className="text-emerald-400 font-mono text-[9px]">100% No-Code</span>
      </div>
      <div className="flex items-center justify-between text-[10px] bg-zinc-800 p-2 rounded">
        <span className="text-zinc-300">Hubspot / Notion / Supabase</span>
        <span className="text-emerald-400 font-bold">Connecté</span>
      </div>
    </div>
  )
}

// 6. Automatisations Visual
export function AutomatisationsVisual() {
  return (
    <div className="p-3 rounded-lg bg-white text-zinc-900 font-sans text-xs space-y-2 border border-zinc-200">
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-1">
          <Bot className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-zinc-800">Agents IA Spécialisés</span>
        </div>
        <span className="text-emerald-600 font-mono text-[9px]">3 Agents Actifs</span>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex items-center justify-between p-1 rounded bg-zinc-50">
          <span>Agent Support Customer</span>
          <span className="text-emerald-600 font-mono text-[9px]">Opérationnel</span>
        </div>
        <div className="flex items-center justify-between p-1 rounded bg-zinc-50">
          <span>Agent Scoring Prospect</span>
          <span className="text-emerald-600 font-mono text-[9px]">Opérationnel</span>
        </div>
      </div>
    </div>
  )
}

// 7. Business Global Visual
export function BusinessVisual() {
  return (
    <div className="p-3 rounded-lg bg-zinc-900 text-white font-sans text-xs space-y-2 border border-zinc-800">
      <div className="flex items-center justify-between text-[10px] text-zinc-400">
        <span>TABLEAU DE PILOTAGE GLOBAL</span>
        <span className="text-emerald-400 font-bold">Business Pérenne</span>
      </div>
      <div className="flex items-center justify-between text-base font-bold font-mono text-zinc-100 pt-1">
        <span>15 000 € /m</span>
        <span className="text-xs text-emerald-400 font-sans font-normal">MRR Stable</span>
      </div>
    </div>
  )
}
