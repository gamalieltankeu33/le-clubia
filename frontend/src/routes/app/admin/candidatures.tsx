import React, { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery as useReactQuery, useMutation as useReactMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import {
  Briefcase,
  Search,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  Save,
  X,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/admin/candidatures')({
  component: AdminCandidaturesPage,
})

interface CandidatureItem {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  pays: string
  projet_type: string
  projet_ia: string
  projet_raison: string
  projet_blocage: string
  deja_essaie: boolean
  deja_essaie_details: string | null
  statut_actuel: string
  heures_semaine: string
  objectif_12m: string
  pret_investir: string
  budget: string
  candidat_raison: string
  status?: string
  notes?: string | null
  created_at: string
  score?: number | null
  qualified?: boolean | null
  is_western?: boolean | null
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  Nouveau: { label: 'Nouveau', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  Qualifié: { label: 'Qualifié', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  'Appel prévu': { label: 'Appel prévu', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  Admis: { label: 'Admis', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  'Non qualifié': { label: 'Non qualifié', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }
}

export function AdminCandidaturesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('Tous')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidatureItem | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Query database for all candidatures / blueprint registrations
  const { data: candidatures = [], isLoading, refetch } = useReactQuery({
    queryKey: ['admin-candidatures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accompagnement_candidatures')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur récupération dossiers:', error)
        toast.error('Erreur lors du chargement des dossiers')
        return []
      }

      return (data || []) as CandidatureItem[]
    }
  })

  // Mutation to update status & notes
  const updateCandidateMutation = useReactMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status?: string; notes?: string }) => {
      const updateData: any = {}
      if (status !== undefined) updateData.status = status
      if (notes !== undefined) updateData.notes = notes

      const { error } = await supabase
        .from('accompagnement_candidatures')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Dossier mis à jour avec succès')
      queryClient.invalidateQueries({ queryKey: ['admin-candidatures'] })
    },
    onError: (err) => {
      console.error(err)
      toast.error('Échec de la mise à jour')
    }
  })

  // Filter logic
  const filteredCandidatures = candidatures.filter(c => {
    const statusMatch = selectedStatusFilter === 'Tous' || (c.status || 'Nouveau') === selectedStatusFilter
    const searchLower = searchQuery.toLowerCase()
    const queryMatch =
      !searchQuery ||
      c.nom.toLowerCase().includes(searchLower) ||
      c.prenom.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.projet_type.toLowerCase().includes(searchLower) ||
      c.projet_ia.toLowerCase().includes(searchLower)

    return statusMatch && queryMatch
  })

  // Stats calculation
  const totalCount = candidatures.length
  const nouveauCount = candidatures.filter(c => (c.status || 'Nouveau') === 'Nouveau').length
  const qualifieCount = candidatures.filter(c => c.status === 'Qualifié' || c.status === 'Appel prévu' || c.status === 'Admis').length
  const nonQualifieCount = candidatures.filter(c => c.status === 'Non qualifié').length

  const handleOpenDetail = (item: CandidatureItem) => {
    setSelectedCandidate(item)
    setAdminNotes(item.notes || '')
  }

  const handleStatusChange = (newStatus: string) => {
    if (!selectedCandidate) return
    setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null)
    updateCandidateMutation.mutate({ id: selectedCandidate.id, status: newStatus })
  }

  const handleSaveNotes = () => {
    if (!selectedCandidate) return
    updateCandidateMutation.mutate({ id: selectedCandidate.id, notes: adminNotes })
  }

  const getWhatsAppLink = (phone: string, firstName: string) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '')
    const msg = `Bonjour ${firstName}, je suis Gamaliel du Club IA. Je vous contacte au sujet de votre inscription au Blueprint Business IA.`
    return `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Blueprint IA — Enregistrements</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Gestion, qualification et suivi des dossiers d'inscription aux Sprints et Blueprints IA.
          </p>
        </div>

        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2 text-xs cursor-pointer">
          <Clock className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </Button>
      </div>

      {/* KPI Stats Grid (EXACT MATCH WITH SCREENSHOT) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">TOTAL INSCRIPTIONS</div>
          <div className="text-2xl font-bold text-zinc-900 font-mono">{totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider">NOUVEAUX DOSSIERS</div>
          <div className="text-2xl font-bold text-blue-900 font-mono">{nouveauCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">QUALIFIÉS / ADMIS</div>
          <div className="text-2xl font-bold text-emerald-900 font-mono">{qualifieCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">NON QUALIFIÉS</div>
          <div className="text-2xl font-bold text-rose-900 font-mono">{nonQualifieCount}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl bg-white border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, prénom, email ou projet..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['Tous', 'Nouveau', 'Qualifié', 'Appel prévu', 'Admis', 'Non qualifié'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                selectedStatusFilter === st
                  ? 'bg-zinc-900 text-white shadow-2xs font-semibold'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table (EXACT MATCH WITH SCREENSHOT) */}
      <div className="rounded-xl bg-white border border-zinc-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-zinc-500">Chargement des dossiers...</div>
        ) : filteredCandidatures.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-zinc-300 mx-auto" />
            <div className="text-sm font-semibold text-zinc-700">Aucun dossier trouvé</div>
            <p className="text-xs text-zinc-400">Aucun enregistrement ne correspond à vos filtres actuels.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                <tr>
                  <th className="p-3.5">Candidat</th>
                  <th className="p-3.5">Score IA</th>
                  <th className="p-3.5">Projet & Objectif</th>
                  <th className="p-3.5">Temps & Budget</th>
                  <th className="p-3.5">Statut</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-sans">
                {filteredCandidatures.map(item => {
                  const statusKey = item.status || 'Nouveau'
                  const badge = STATUS_BADGES[statusKey] || STATUS_BADGES['Nouveau']

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-zinc-900">{item.prenom} {item.nom}</div>
                        <div className="text-[11px] text-zinc-500">{item.email}</div>
                        <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{item.telephone} • {item.pays}</span>
                          {item.is_western && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/50">
                              Occidental
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {item.score !== undefined && item.score !== null ? (
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              'inline-flex items-center justify-center w-12 py-1 rounded-lg text-xs font-bold font-mono border',
                              item.score >= 16
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.score >= 12
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}>
                              {item.score}/20
                            </span>
                            {item.qualified && (
                              <span className="text-[8px] font-bold text-emerald-700 uppercase bg-emerald-50/80 px-1 py-0.5 rounded border border-emerald-100 w-12 text-center">
                                Cible
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 font-mono">-</span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-zinc-800 line-clamp-1">{item.projet_type || 'Sprint Business IA'}</div>
                        <div className="text-[11px] text-zinc-500 line-clamp-2">{item.projet_ia}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-mono text-zinc-800 font-bold">{item.budget || '10 000 FCFA'}</div>
                        <div className="text-[11px] text-zinc-500">{item.heures_semaine || '10+ heures'}</div>
                      </td>

                      <td className="p-3.5">
                        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-semibold', badge.bg, badge.color)}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="p-3.5 text-zinc-400 text-[11px] whitespace-nowrap">
                        {format(new Date(item.created_at), 'dd MMM yyyy, HH:mm', { locale: fr })}
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          onClick={() => handleOpenDetail(item)}
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 px-3 gap-1 cursor-pointer"
                        >
                          <span>Examiner</span>
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-3xl bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-sans"
            >
              {/* Modal Top Bar */}
              <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                    {selectedCandidate.prenom[0]}{selectedCandidate.nom[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      {selectedCandidate.prenom} {selectedCandidate.nom}
                    </h3>
                    <div className="text-xs text-zinc-500 flex items-center gap-3">
                      <span>{selectedCandidate.email}</span>
                      <span>•</span>
                      <span>{selectedCandidate.telephone}</span>
                      <span>•</span>
                      <span>{selectedCandidate.pays}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="w-8 h-8 rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Scroll Area */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">

                {/* WhatsApp Quick Action Banner */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="font-bold text-emerald-900 text-xs">Contacter directement sur WhatsApp</div>
                    <div className="text-[10px] text-emerald-700">Envoyer un message au candidat : {selectedCandidate.telephone}</div>
                  </div>
                  <a
                    href={getWhatsAppLink(selectedCandidate.telephone, selectedCandidate.prenom)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#25D366] hover:bg-[#1FAA50] text-white rounded-lg text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ouvrir WhatsApp</span>
                  </a>
                </div>

                {/* Score Diagnostic Card */}
                {selectedCandidate.score !== undefined && selectedCandidate.score !== null && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-zinc-200 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center font-black font-mono text-lg border shrink-0',
                        selectedCandidate.score >= 16
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : selectedCandidate.score >= 12
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                      )}>
                        {selectedCandidate.score}/20
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900 text-xs">Score Diagnostic IA</div>
                        <div className="text-[10px] text-zinc-500 font-medium">
                          Indice d'éligibilité et de maturité
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center sm:justify-end gap-2">
                      <span className={cn(
                        'px-2.5 py-1 rounded-md text-[9px] font-bold text-white uppercase tracking-wider',
                        selectedCandidate.score >= 16
                          ? 'bg-emerald-500'
                          : selectedCandidate.score >= 12
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                      )}>
                        {selectedCandidate.score >= 16 ? 'ELITE' : selectedCandidate.score >= 12 ? 'QUALIFIÉ' : 'À CONSOLIDER'}
                      </span>
                      {selectedCandidate.is_western && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          Cible Occidentale
                        </span>
                      )}
                      {selectedCandidate.qualified && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-zinc-900 px-2 py-1 rounded shadow-xs">
                          Cible Premium
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Status Selector Header Bar */}
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold">Statut de Qualification</span>
                    <div className="font-bold text-zinc-800 text-sm">Changer l'état du dossier :</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {['Nouveau', 'Qualifié', 'Appel prévu', 'Admis', 'Non qualifié'].map(st => {
                      const isActive = (selectedCandidate.status || 'Nouveau') === st
                      return (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                            isActive
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs'
                              : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                          )}
                        >
                          {st}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Section 1: Projet & Vision */}
                <div className="space-y-3 p-4 rounded-xl border border-zinc-200 bg-white">
                  <h4 className="font-bold text-zinc-900 text-xs text-blue-600 uppercase tracking-wider">
                    1. Projet & Vision
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-zinc-400 text-[10px]">Type de projet :</span>
                      <div className="font-semibold text-zinc-800">{selectedCandidate.projet_type || 'Sprint Business IA'}</div>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px]">Statut actuel :</span>
                      <div className="font-semibold text-zinc-800">{selectedCandidate.statut_actuel}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-100">
                    <span className="text-zinc-400 text-[10px]">Ce qu'il/elle souhaite construire :</span>
                    <p className="text-zinc-800 font-medium leading-relaxed bg-zinc-50 p-2.5 rounded border border-zinc-100 mt-1">
                      {selectedCandidate.projet_ia}
                    </p>
                  </div>
                </div>

                {/* Section 2: Freins & Motivations */}
                <div className="space-y-3 p-4 rounded-xl border border-zinc-200 bg-white">
                  <h4 className="font-bold text-zinc-900 text-xs text-purple-600 uppercase tracking-wider">
                    2. Blocages & Motivations
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-zinc-400 text-[10px]">Principal blocage :</span>
                      <p className="text-zinc-800 leading-relaxed bg-zinc-50 p-2 rounded border border-zinc-100 mt-0.5">
                        {selectedCandidate.projet_blocage}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px]">Pourquoi maintenant ? :</span>
                      <p className="text-zinc-800 leading-relaxed bg-zinc-50 p-2 rounded border border-zinc-100 mt-0.5">
                        {selectedCandidate.projet_raison}
                      </p>
                    </div>
                    {selectedCandidate.deja_essaie && (
                      <div>
                        <span className="text-zinc-400 text-[10px]">Expériences passées :</span>
                        <p className="text-zinc-800 leading-relaxed bg-amber-50 text-amber-900 p-2 rounded border border-amber-200 mt-0.5">
                          {selectedCandidate.deja_essaie_details || 'Déjà essayé d\'autres accompagnements'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Engagement & Budget */}
                <div className="space-y-3 p-4 rounded-xl border border-zinc-200 bg-white">
                  <h4 className="font-bold text-zinc-900 text-xs text-emerald-600 uppercase tracking-wider">
                    3. Engagement & Moyens
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-400 text-[10px]">Temps dispo :</span>
                      <div className="font-bold text-zinc-900">{selectedCandidate.heures_semaine}</div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-400 text-[10px]">Budget prêt :</span>
                      <div className="font-bold text-emerald-600 font-mono">{selectedCandidate.budget}</div>
                    </div>
                    <div className="p-2.5 rounded bg-zinc-50 border border-zinc-100">
                      <span className="text-zinc-400 text-[10px]">Prêt à investir :</span>
                      <div className="font-bold text-zinc-900">{selectedCandidate.pret_investir}</div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-zinc-400 text-[10px]">Pourquoi c'est un bon candidat :</span>
                    <p className="text-zinc-800 leading-relaxed bg-zinc-50 p-2.5 rounded border border-zinc-100 mt-1">
                      {selectedCandidate.candidat_raison}
                    </p>
                  </div>
                </div>

                {/* Section 4: Notes internes Admin */}
                <div className="space-y-2 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Notes Interne Admin</span>
                    </label>
                    <Button onClick={handleSaveNotes} size="sm" className="h-7 text-[11px] gap-1 bg-zinc-900 text-white cursor-pointer">
                      <Save className="w-3 h-3" />
                      <span>Sauvegarder notes</span>
                    </Button>
                  </div>
                  <textarea
                    rows={3}
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Saisissez des notes d'évaluation, commentaires d'entretien, etc..."
                    className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs focus:ring-2 focus:ring-zinc-900 focus:outline-none"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">
                  ID: {selectedCandidate.id.substring(0, 8)}...
                </span>
                <Button onClick={() => setSelectedCandidate(null)} variant="outline" size="sm" className="cursor-pointer">
                  Fermer
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
