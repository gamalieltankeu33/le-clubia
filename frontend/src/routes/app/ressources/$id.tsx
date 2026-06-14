import { useEffect, useState } from 'react'
import { createFileRoute, Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Copy,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import {
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_VISUAL,
  formatFileSize,
  getResourceSignedUrl,
} from '@/lib/resource-helpers'
import type { Resource } from '@/lib/database.types'
import { MarkdownRenderer } from '@/components/coach/markdown-renderer'
import {
  PremiumLockedScreen,
  useIsTrialUser,
} from '@/components/shared/premium-lock'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/ressources/$id')({
  component: ResourceDetailPage,
})

async function fetchResource(id: string): Promise<Resource | null> {
  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as Resource | null
}

function ResourceDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const router = useRouter()
  const isTrial = useIsTrialUser()

  const query = useQuery({
    queryKey: ['resource-detail', id],
    queryFn: () => fetchResource(id),
    staleTime: 60_000,
  })

  function handleBack() {
    if (window.history.length > 1) {
      router.history.back()
    } else {
      navigate({ to: '/app/ressources' })
    }
  }

  if (query.isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="h-8 w-32 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="mt-8 h-[60vh] w-full animate-pulse rounded-2xl bg-[var(--secondary)]" />
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Ressource introuvable
        </h1>
        <p className="mt-3 text-[var(--muted-foreground)]">
          Cette ressource n'existe plus ou n'est pas accessible.
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/ressources">
            <ArrowLeft className="h-4 w-4" />
            Retour à la bibliothèque
          </Link>
        </Button>
      </div>
    )
  }

  const r = query.data

  // Verrou Plan Découverte : on intercepte avant le rendu du contenu pour
  // ne JAMAIS exposer signed URL, content texte ou external_url premium.
  if (r.is_premium && isTrial) {
    return <PremiumLockedScreen backTo="/app/ressources" itemKind="ressource" />
  }

  const visual = RESOURCE_TYPE_VISUAL[r.resource_type]
  const TypeIcon = visual.icon

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <Button variant="outline" size="sm" onClick={handleBack}>
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              visual.chipBg,
              visual.chipFg,
            )}
          >
            <TypeIcon className="h-3 w-3" />
            {RESOURCE_TYPE_LABELS[r.resource_type]}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {r.category}
          </span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          {r.title}
        </h1>
        {r.description && (
          <p className="mt-3 max-w-prose text-lg text-[var(--muted-foreground)]">
            {r.description}
          </p>
        )}
      </header>

      <div className="mt-8">
        <ResourceContent resource={r} />
      </div>
    </div>
  )
}

function ResourceContent({ resource }: { resource: Resource }) {
  if (resource.resource_type === 'tool_link') {
    return <ToolLinkBlock resource={resource} />
  }

  // Si la nouvelle source de vérité (file_url) existe, on rend le PDF.
  if (resource.file_url) {
    return <PdfPreviewBlock resource={resource} path={resource.file_url} />
  }

  // Fallback : ancien upload générique sous download_url.
  if (resource.download_url) {
    return <PdfPreviewBlock resource={resource} path={resource.download_url} />
  }

  // Fallback ultime : ancien prompt en texte stocké dans content.
  if (resource.content?.trim()) {
    return <LegacyContentBlock content={resource.content} />
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">
        Cette ressource est en cours de préparation.
      </p>
    </div>
  )
}

function ToolLinkBlock({ resource }: { resource: Resource }) {
  if (!resource.external_url) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted-foreground)]">
        Cette ressource n'a pas encore de lien.
      </div>
    )
  }
  let host = resource.external_url
  try {
    host = new URL(resource.external_url).hostname.replace(/^www\./, '')
  } catch {
    // garder l'URL brute si parsing impossible
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <p className="text-sm text-[var(--muted-foreground)]">Domaine</p>
      <p className="mt-1 font-medium">{host}</p>
      <Button asChild className="mt-5">
        <a
          href={resource.external_url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" />
          Visiter le site
        </a>
      </Button>
    </div>
  )
}

function PdfPreviewBlock({
  resource,
  path,
}: {
  resource: Resource
  path: string
}) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setSignedUrl(null)
    setLoadError(null)
    getResourceSignedUrl(path)
      .then((url) => {
        if (!cancelled) setSignedUrl(url)
      })
      .catch((err) => {
        console.error('[resource-detail] signed url error', err)
        if (!cancelled) setLoadError('Impossible de charger le PDF.')
      })
    return () => {
      cancelled = true
    }
  }, [path])

  async function handleDownload() {
    if (!signedUrl) return
    try {
      // Force le download avec le nom d'origine quand dispo, sinon laisse le navigateur décider.
      const a = document.createElement('a')
      a.href = signedUrl
      a.download = resource.file_name ?? ''
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }
  }

  function handleFullscreen() {
    if (!signedUrl) return
    window.open(signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-medium">
            {resource.file_name ?? 'Document PDF'}
          </p>
          {resource.file_size_kb ? (
            <p className="text-xs text-[var(--muted-foreground)]">
              {formatFileSize(resource.file_size_kb)}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            disabled={!signedUrl}
          >
            <Maximize2 className="h-4 w-4" />
            Plein écran
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={!signedUrl}>
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>
      </div>

      {loadError ? (
        <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {loadError}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setLoadError(null)
                getResourceSignedUrl(path)
                  .then(setSignedUrl)
                  .catch(() => setLoadError('Impossible de charger le PDF.'))
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      ) : !signedUrl ? (
        <div className="flex h-[60vh] items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex flex-col items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="h-6 w-6 animate-spin" />
            Chargement du PDF…
          </div>
        </div>
      ) : (
        <iframe
          src={signedUrl}
          title={resource.title}
          className="h-[70vh] w-full rounded-2xl border border-[var(--border)] bg-white md:h-[80vh]"
        />
      )}

      <p className="text-xs text-[var(--muted-foreground)]">
        Si le PDF ne s'affiche pas (Safari mobile par exemple), utilise le
        bouton Télécharger ou Plein écran.
      </p>
    </div>
  )
}

function LegacyContentBlock({ content }: { content: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copié dans le presse-papier.')
    } catch {
      toast.error('Copie impossible.')
    }
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">
          Format texte (legacy)
        </p>
        <Button variant="outline" size="sm" onClick={copy}>
          <Copy className="h-4 w-4" />
          Copier
        </Button>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
        <MarkdownRenderer content={content} />
      </div>
    </div>
  )
}
