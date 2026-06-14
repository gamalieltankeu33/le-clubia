import { useEffect, useState } from 'react'
import { Reveal } from './reveal'
import { supabase } from '@/lib/supabase'

const SAMPLE_INITIALS = ['CR', 'YB', 'SM', 'TG', 'AL', 'NK']

export function SocialProof() {
  const [count, setCount] = useState<number | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // La RPC n'est pas dans Database['public']['Functions'].
      // @ts-expect-error - get_public_member_count est une RPC custom non typée
      const { data, error: rpcErr } = await supabase.rpc('get_public_member_count')
      if (cancelled) return
      if (rpcErr || typeof data !== 'number') {
        setError(true)
      } else {
        setCount(data)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="overflow-hidden border-y border-[#E5E5E5] bg-[#FAFAF9]">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <Reveal className="flex items-center gap-4">
          {/* Avatars empilés */}
          <div className="flex -space-x-2">
            {SAMPLE_INITIALS.map((s, i) => (
              <span
                key={s}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white shadow-sm"
                style={{
                  backgroundColor: [
                    '#0F1E4D',
                    '#2563EB',
                    '#0A0A0A',
                    '#3858d8',
                    '#60A5FA',
                    '#1c3a9e',
                  ][i],
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight text-[#0A0A0A] tabular-nums">
              {count !== null && !error
                ? count.toLocaleString('fr-FR')
                : '—'}
              <span className="ml-1 text-sm font-normal text-[#737373]">
                {error || count === null
                  ? 'passionnés d\'IA francophones'
                  : 'passionnés ont déjà rejoint'}
              </span>
            </p>
            <p className="text-xs text-[#737373]">
              Rejoint par les passionnés d'IA francophones
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="hidden lg:block">
          <div className="flex items-center gap-6 text-xs uppercase tracking-[0.18em] text-[#737373]">
            <span>Sources surveillées</span>
            <Logo>OpenAI</Logo>
            <Logo>Anthropic</Logo>
            <Logo>Google AI</Logo>
            <Logo>Hugging Face</Logo>
            <Logo>Mistral</Logo>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Logo({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-sm font-semibold tracking-normal text-[#0A0A0A]/70">
      {children}
    </span>
  )
}
