import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AvatarDisplay } from '@/components/avatar-display'
import { useAuthStore } from '@/stores/auth-store'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compress-image'
import { extractHashtags } from '@/lib/extract-hashtags'
import { cn } from '@/lib/utils'
import { MentionExtension } from './mention-extension'
import { useConfirm } from '@/hooks/use-confirm'
import { checkRateLimit } from '@/lib/use-rate-limit'

const MAX_CHARS = 2000
const MAX_IMAGE_MB = 5

export function PostComposerModal({
  open,
  onClose,
  onPosted,
}: {
  open: boolean
  onClose: () => void
  onPosted: (postId: string) => void
}) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const { confirm, ConfirmDialog } = useConfirm()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Compteur incrémenté à chaque update Tiptap → force le re-render React
  // pour que `editor.getText()` et `editor.isActive(...)` soient frais.
  const [, setEditorRev] = useState(0)
  const bumpRev = () => setEditorRev((r) => r + 1)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [3] },
        // Désactive le Link interne de StarterKit pour utiliser
        // notre @tiptap/extension-link configuré (openOnClick, autolink, target).
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Placeholder.configure({
        placeholder:
          'Partage une idée, une question, une découverte IA… utilise @ pour mentionner un membre.',
      }),
      MentionExtension,
    ],
    content: '',
    onUpdate: bumpRev,
    onSelectionUpdate: bumpRev,
    editorProps: {
      attributes: {
        class:
          'min-h-[140px] max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--ring)]',
      },
    },
  })

  // Reset à chaque ouverture
  useEffect(() => {
    if (open) {
      editor?.commands.clearContent()
      setImageFile(null)
      setImagePreview(null)
      setShowLinkInput(false)
      setLinkUrl('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Cleanup du blob preview au démontage
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  if (!open) return null

  const text = editor?.getText() ?? ''
  const charCount = text.length
  const isEmpty = charCount === 0 && !imageFile
  const overLimit = charCount > MAX_CHARS

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.error(
        `Cette image est trop grande. Format recommandé : JPG ou PNG, max ${MAX_IMAGE_MB} Mo.`,
      )
      e.target.value = ''
      return
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
  }

  async function handleSubmit() {
    if (!user || isEmpty || overLimit || submitting) return

    // Validation lien : 100% défensif.
    //  - Si l'input lien est fermé OU vide après trim → on envoie NULL en DB
    //  - Sinon, on accepte n'importe quelle URL http:// ou https:// jusqu'à 500 chars
    //    (volontairement souple : pas de regex stricte type "domaine valide" qui
    //     rejetterait des URLs Google Meet / Zoom / hash params légitimes).
    const trimmedLink = linkUrl.trim()
    let finalLinkUrl: string | null = null
    if (showLinkInput && trimmedLink) {
      if (!/^https?:\/\//i.test(trimmedLink)) {
        toast.error('Le lien doit commencer par http:// ou https://.')
        return
      }
      if (trimmedLink.length > 500) {
        toast.error('Le lien est trop long (500 caractères max).')
        return
      }
      finalLinkUrl = trimmedLink
    }

    // Rate limit AVANT setSubmitting → si bloqué, on n'entre même pas
    // en état "submitting" et le composer reste interactif (l'admin /
    // user peut copier son brouillon ailleurs sans le perdre).
    const rl = await checkRateLimit('post_create')
    if (!rl.allowed) {
      toast.error(
        `Tu as atteint la limite de publications. ${rl.message}`,
      )
      return
    }

    setSubmitting(true)
    try {
      // 1. Upload image si présente
      let imageUrl: string | null = null
      if (imageFile) {
        const compressed = await compressImage(imageFile, {
          maxWidthOrHeight: 1280,
          maxSizeMB: 1,
          initialQuality: 0.85,
        })
        const ext =
          compressed.type === 'image/png'
            ? 'png'
            : compressed.type === 'image/webp'
              ? 'webp'
              : 'jpg'
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('post-images')
          .upload(path, compressed, {
            contentType: compressed.type || 'image/jpeg',
            upsert: false,
          })
        if (upErr) throw upErr
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(path)
        imageUrl = data.publicUrl
      }

      // 2. Insert post
      const html = editor?.getHTML() ?? ''
      const plain = editor?.getText() ?? ''
      const hashtags = extractHashtags(plain)
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: html,
          image_url: imageUrl,
          link_url: finalLinkUrl,
          hashtags,
        })
        .select('id')
        .single()
      if (error || !data) {
        throw error ?? new Error('Insert sans réponse.')
      }

      toast.success('Post publié !')
      onPosted(data.id)
      onClose()
    } catch (err) {
      // Affiche le VRAI message d'erreur (Supabase / Storage / réseau) plutôt
      // qu'un message générique. Aide l'utilisateur ET permet de débugger
      // les CHECK constraints DB et autres rejets côté serveur.
      console.error('[post-composer] publication échouée:', err)
      const message =
        err instanceof Error && err.message
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Publication impossible. Réessaie.'
      toast.error(`Publication impossible : ${message}`)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClose() {
    if (!isEmpty && !submitting) {
      const ok = await confirm({
        title: 'Abandonner ce brouillon ?',
        description:
          'Le contenu et l’image que tu viens de saisir seront perdus.',
        confirmLabel: 'Abandonner',
        cancelLabel: 'Continuer à rédiger',
        variant: 'destructive',
      })
      if (!ok) return
    }
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        key="dialog"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-xl -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Créer un post"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Créer un post
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <AvatarDisplay
              avatarUrl={profile?.avatar_url}
              firstName={profile?.first_name}
              lastName={profile?.last_name}
              email={user?.email}
              isVerified={profile?.is_verified ?? false}
              size="md"
            />
            <p className="text-sm font-medium">
              {[profile?.first_name, profile?.last_name]
                .filter(Boolean)
                .join(' ') || user?.email}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            <p
              className={cn(
                'text-right text-xs tabular-nums',
                overLimit
                  ? 'text-red-600'
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {charCount}/{MAX_CHARS}
            </p>
          </div>

          {imagePreview && (
            <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)]">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="max-h-72 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  aria-label="Retirer l'image"
                  disabled={submitting}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {showLinkInput && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2">
              <Link2 className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                disabled={submitting}
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false)
                  setLinkUrl('')
                }}
                aria-label="Retirer le lien"
                disabled={submitting}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--background)] px-5 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImagePick}
            className="hidden"
          />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={submitting || Boolean(imageFile)}
            >
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (showLinkInput) {
                  setShowLinkInput(false)
                  setLinkUrl('')
                } else {
                  setShowLinkInput(true)
                }
              }}
              disabled={submitting}
              aria-pressed={showLinkInput}
            >
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Lien</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isEmpty || overLimit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publication…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Publier
              </>
            )}
          </Button>
        </div>
      </motion.div>
      <ConfirmDialog />
    </AnimatePresence>
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null

  function setLink() {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien :', previous ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
      <ToolbarButton
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
        ariaLabel="Gras"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        ariaLabel="Italique"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('link')}
        onClick={setLink}
        ariaLabel="Lien"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-[var(--border)]" />
      <ToolbarButton
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        ariaLabel="Liste à puces"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        ariaLabel="Liste numérotée"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  )
}

function ToolbarButton({
  active,
  onClick,
  ariaLabel,
  children,
}: {
  active: boolean
  onClick: () => void
  ariaLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded transition-colors',
        active
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
          : 'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
      )}
    >
      {children}
    </button>
  )
}
