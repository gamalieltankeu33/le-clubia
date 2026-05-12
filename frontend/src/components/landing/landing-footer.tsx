import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-4 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <BrandLogo size="md" variant="primary" showSignature />
            <p className="mt-4 max-w-xs text-sm text-[var(--muted-foreground)]">
              La communauté francophone des passionnés d'IA. Formations,
              coach, actualités, ressources.
            </p>
            <a
              href="mailto:hello@leclubia.com"
              className="mt-3 inline-block text-sm text-[var(--primary)] transition-colors hover:underline"
            >
              hello@leclubia.com
            </a>
          </div>

          {/* Produit */}
          <FooterColumn title="Produit">
            <li>
              <Link
                to="/catalogue"
                className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
              >
                Formations
              </Link>
            </li>
            <FooterLink href="#piliers">Communauté</FooterLink>
            <FooterLink href="#piliers">Coach IA</FooterLink>
            <FooterLink href="#piliers">Actualités</FooterLink>
            <FooterLink href="#piliers">Ressources</FooterLink>
            <FooterLink href="#tarif">Tarif</FooterLink>
          </FooterColumn>

          {/* Légal */}
          <FooterColumn title="Légal">
            <FooterRouterLink to="/cgu">
              Conditions d'utilisation
            </FooterRouterLink>
            <FooterRouterLink to="/confidentialite">
              Politique de confidentialité
            </FooterRouterLink>
            <FooterRouterLink to="/mentions-legales">
              Mentions légales
            </FooterRouterLink>
          </FooterColumn>

          {/* Réseaux */}
          <FooterColumn title="Suis-nous">
            <SocialLink
              href="https://instagram.com/leclubia"
              label="Instagram"
              icon={<InstagramGlyph />}
            />
            <SocialLink
              href="https://www.tiktok.com/@leclubia"
              label="TikTok"
              icon={<TiktokGlyph />}
            />
            <SocialLink
              href="https://youtube.com/@leclubia"
              label="YouTube"
              icon={<YoutubeGlyph />}
            />
            <SocialLink
              href="https://linkedin.com/company/leclubia"
              label="LinkedIn"
              icon={<LinkedinGlyph />}
            />
          </FooterColumn>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-[var(--border)] pt-6 text-xs text-[var(--muted-foreground)] sm:flex-row">
          <span>
            © {new Date().getFullYear()} Le Club IA — Une création BetterZapp
            LLC
          </span>
          <span className="inline-flex items-center gap-1.5">
            Made with
            <Heart className="h-3 w-3 fill-[var(--accent)] text-[var(--accent)]" />
            in France
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
        {title}
      </h3>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <li>
      <a
        href={href}
        className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        {children}
      </a>
    </li>
  )
}

function FooterRouterLink({
  to,
  children,
}: {
  to: '/cgu' | '/confidentialite' | '/mentions-legales'
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        {children}
      </Link>
    </li>
  )
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
    >
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      {label}
    </a>
  )
}

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
} as const

function TiktokGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.8a8.16 8.16 0 0 0 4.77 1.52V6.87a4.83 4.83 0 0 1-1.84-.18z" />
    </svg>
  )
}

function InstagramGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44C13.276 1.82 12.647 1.62 12 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245C2.823 9.723 2.624 10.353 2.604 11c.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zm-9.736 4.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" opacity="0" />
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.34 4.14.63a5.84 5.84 0 0 0-2.13 1.38A5.84 5.84 0 0 0 .63 4.14C.34 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.27 2.15.56 2.91.3.79.7 1.46 1.38 2.13a5.84 5.84 0 0 0 2.13 1.38c.76.29 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.27 2.91-.56a5.84 5.84 0 0 0 2.13-1.38 5.84 5.84 0 0 0 1.38-2.13c.29-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.27-2.15-.56-2.91a5.84 5.84 0 0 0-1.38-2.13A5.84 5.84 0 0 0 19.86.63C19.1.34 18.22.13 16.95.07 15.67.01 15.26 0 12 0z" />
      <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32M12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
      <circle cx="18.41" cy="5.59" r="1.44" />
    </svg>
  )
}

function YoutubeGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M23.5 6.2a3 3 0 0 0-2.12-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.53A3 3 0 0 0 .5 6.2C0 8.07 0 12 0 12s0 3.93.5 5.8a3 3 0 0 0 2.12 2.12C4.5 20.45 12 20.45 12 20.45s7.5 0 9.38-.53a3 3 0 0 0 2.12-2.12C24 15.93 24 12 24 12s0-3.93-.5-5.8M9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  )
}

function LinkedinGlyph() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.32-.02-3.03-1.85-3.03-1.85 0-2.13 1.45-2.13 2.94v5.66H9.36V9h3.4v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}
