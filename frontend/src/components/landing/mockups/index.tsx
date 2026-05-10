// Mockups stylisés (pas des screenshots) pour les sections de la landing.
// Style "Apple/Stripe abstract product" : on suggère l'UI plutôt que de la montrer.
import {
  Clock,
  GraduationCap,
  Library,
  MessageCircle,
  Newspaper,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Cadre "browser" générique avec dots macOS. */
function BrowserChrome({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xl shadow-black/5',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[#FAFAF9] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
        <span className="ml-3 h-3.5 flex-1 rounded-full bg-[#E5E5E5]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

// ===========================================================================
// Dashboard (utilisé en hero si pas de vidéo)
// ===========================================================================
export function DashboardMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="flex h-[420px] w-full bg-[#FAFAF9]">
        {/* Sidebar */}
        <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-white p-3 md:flex">
          <div className="flex items-center gap-2 px-2 py-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1E40AF] text-white">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="font-display text-xs font-semibold">Le Club IA</span>
          </div>
          <SidebarItem active>Tableau de bord</SidebarItem>
          <SidebarItem>Formations</SidebarItem>
          <SidebarItem>Communauté</SidebarItem>
          <SidebarItem>Actualités</SidebarItem>
          <SidebarItem>Ressources</SidebarItem>
        </div>
        {/* Main */}
        <div className="flex-1 overflow-hidden p-5">
          <div className="space-y-1">
            <div className="h-3 w-32 rounded bg-[#E5E5E5]" />
            <div className="h-7 w-56 rounded-md bg-[#0A0A0A]/85" />
          </div>

          {/* Featured coach card */}
          <div className="relative mt-5 flex items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3858d8] p-4 text-white">
            <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#60A5FA]/40 blur-2xl" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="relative space-y-1">
              <div className="h-2 w-16 rounded bg-white/40" />
              <div className="h-3 w-40 rounded bg-white/80" />
            </div>
          </div>

          {/* Grid 2x2 piliers */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[GraduationCap, Users, Newspaper, Library].map((Icon, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-white p-3"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1E40AF]/10 text-[#1E40AF]">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="mt-2 space-y-1">
                  <div className="h-2 w-20 rounded bg-[#0A0A0A]/80" />
                  <div className="h-2 w-full rounded bg-[#E5E5E5]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function SidebarItem({
  children,
  active,
}: {
  children: React.ReactNode
  active?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-7 items-center rounded-md px-2 text-[10px]',
        active ? 'bg-[#1E40AF]/10 text-[#1E40AF]' : 'text-[#737373]',
      )}
    >
      {children}
    </div>
  )
}

// ===========================================================================
// Catalog formations
// ===========================================================================
export function CatalogMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="grid gap-3 bg-[#FAFAF9] p-5 sm:grid-cols-2">
        {[
          { cat: 'Automatisation', dur: '2h 30min' },
          { cat: 'Prompt eng.', dur: '1h 45min' },
          { cat: 'Vidéo IA', dur: '3h 10min' },
          { cat: 'Création', dur: '2h' },
        ].map((f, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
          >
            <div className="aspect-[16/9] bg-gradient-to-br from-[#1E40AF] to-[#3858d8]" />
            <div className="space-y-2 p-3">
              <span className="inline-flex rounded-full bg-[#1E40AF]/10 px-2 py-0.5 text-[9px] font-medium text-[#1E40AF]">
                {f.cat}
              </span>
              <div className="h-2.5 w-full rounded bg-[#0A0A0A]/85" />
              <div className="h-2 w-3/4 rounded bg-[#E5E5E5]" />
              <div className="flex items-center gap-2 pt-1 text-[9px] text-[#737373]">
                <Clock className="h-2.5 w-2.5" />
                {f.dur}
              </div>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  )
}

// ===========================================================================
// Feed communauté
// ===========================================================================
export function FeedMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="space-y-3 bg-[#FAFAF9] p-5">
        {[
          { name: 'Camille R.', body: 'Découverte du jour : ce nouveau workflow Make permet de...' },
          { name: 'Yanis B.', body: 'Quelqu\'un a déjà testé Claude pour générer du code Python ?' },
          { name: 'Sofia M.', body: 'Mon top 5 prompts qui changent vraiment la donne en 2026.' },
        ].map((p, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#60A5FA]" />
              <div className="space-y-1">
                <div className="h-2.5 w-24 rounded bg-[#0A0A0A]/85" />
                <div className="h-1.5 w-12 rounded bg-[#E5E5E5]" />
              </div>
            </div>
            <p className="mt-3 line-clamp-2 text-[10px] leading-snug text-[#0A0A0A]/80">
              {p.body}
            </p>
            <div className="mt-3 flex gap-3 text-[9px] text-[#737373]">
              <span>♥ 12</span>
              <span>{i + 2} commentaires</span>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  )
}

// ===========================================================================
// Coach IA chat
// ===========================================================================
export function CoachMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="flex h-[460px] flex-col bg-[#FAFAF9]">
        {/* Header coach */}
        <div className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#60A5FA]/15 text-[#60A5FA]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-display text-xs font-semibold">Coach IA</p>
            <p className="text-[9px] text-[#737373]">Ton assistant 24/7</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-hidden p-4">
          <CoachBubble
            role="assistant"
            text="Salut Camille ! Je suis ton Coach IA. Pose-moi tes questions sur l'IA, l'automatisation, les outils…"
          />
          <CoachBubble
            role="user"
            text="Comment je peux automatiser ma veille IA ?"
          />
          <CoachBubble
            role="assistant"
            text="Excellente question. Je te propose 3 approches selon ton niveau technique : 1) Make + flux RSS, 2) un agent custom avec n8n…"
          />
          <CoachBubble role="user" text="Tu peux m'expliquer Make ?" />
        </div>

        {/* Composer */}
        <div className="border-t border-[var(--border)] bg-white p-3">
          <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[#FAFAF9] px-3 py-2 text-[10px] text-[#737373]">
            <span className="flex-1">Pose ta question…</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1E40AF] text-white">
              <PlayCircle className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </BrowserChrome>
  )
}

function CoachBubble({
  role,
  text,
}: {
  role: 'user' | 'assistant'
  text: string
}) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-br-md bg-[#1E40AF] px-3 py-2 text-[10px] leading-snug text-white">
          {text}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#60A5FA]/15 text-[#60A5FA]">
        <Sparkles className="h-3 w-3" />
      </span>
      <div className="max-w-[75%] rounded-2xl rounded-tl-md bg-[#F4F4F5] px-3 py-2 text-[10px] leading-snug text-[#0A0A0A]">
        {text}
      </div>
    </div>
  )
}

// ===========================================================================
// News articles cards
// ===========================================================================
export function NewsMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="grid gap-3 bg-[#FAFAF9] p-5 sm:grid-cols-2">
        {[
          { cat: 'Modèles', src: 'openai.com', t: 'GPT-X dépasse Claude sur les benchmarks de code' },
          { cat: 'Lancements', src: 'huggingface.co', t: 'Mistral publie son nouveau modèle open source' },
          { cat: 'Outils', src: 'anthropic.com', t: 'Claude lance les agents autonomes en production' },
          { cat: 'Business', src: 'techcrunch.com', t: 'Les levées de fonds IA atteignent un nouveau record' },
        ].map((a, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-[var(--border)] bg-white"
          >
            <div
              className={cn(
                'aspect-[16/9]',
                i % 2 === 0
                  ? 'bg-gradient-to-br from-[#1E40AF] to-[#3858d8]'
                  : 'bg-gradient-to-br from-[#60A5FA] to-[#93C5FD]',
              )}
            >
              <Newspaper className="ml-auto mr-2 mt-2 h-5 w-5 text-white/40" />
            </div>
            <div className="space-y-2 p-3">
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium',
                  i % 2 === 0
                    ? 'bg-[#1E40AF]/10 text-[#1E40AF]'
                    : 'bg-[#60A5FA]/15 text-[#60A5FA]',
                )}
              >
                {a.cat}
              </span>
              <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-[#0A0A0A]">
                {a.t}
              </p>
              <div className="text-[9px] text-[#737373]">{a.src}</div>
            </div>
          </div>
        ))}
      </div>
    </BrowserChrome>
  )
}

// ===========================================================================
// Resources library
// ===========================================================================
export function ResourcesMockup({ className }: { className?: string }) {
  return (
    <BrowserChrome className={className}>
      <div className="grid gap-3 bg-[#FAFAF9] p-5 sm:grid-cols-3">
        {[
          { i: Sparkles, t: 'Pack 50 prompts', cat: 'Prompts' },
          { i: Library, t: 'Templates Notion', cat: 'Templates' },
          { i: MessageCircle, t: 'Guide Make 2026', cat: 'Guides' },
          { i: Sparkles, t: 'Workflow n8n', cat: 'Workflows' },
          { i: Library, t: 'Cheatsheet Claude', cat: 'Prompts' },
          { i: MessageCircle, t: 'Outils IA 2026', cat: 'Outils' },
        ].map((r, i) => {
          const Icon = r.i
          return (
            <div
              key={i}
              className="rounded-xl border border-[var(--border)] bg-white p-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E40AF]/10 text-[#1E40AF]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="mt-2 space-y-1">
                <div className="h-2 w-16 rounded bg-[#E5E5E5]" />
                <div className="h-2.5 w-full rounded bg-[#0A0A0A]/80" />
              </div>
            </div>
          )
        })}
      </div>
    </BrowserChrome>
  )
}
