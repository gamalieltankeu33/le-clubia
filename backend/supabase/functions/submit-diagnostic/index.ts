// Le Club IA — Edge Function "submit-diagnostic"
// Reçoit les réponses au diagnostic, calcule le score de sérieux, persiste dans la DB,
// et envoie les emails de notification et de récapitulatif via Resend.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getCorsHeaders, handleCorsPreflight } from '../_shared/cors.ts'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_DEFAULT = 'Le Club IA <noreply@leclub-ia.com>'
const FROM_SANDBOX = 'Le Club IA <onboarding@resend.dev>'
const REPLY_TO = 'betterzapp@gmail.com'
const ADMIN_EMAIL = 'ghislaintankeu6@gmail.com'

interface DiagnosticSubmission {
  prenom: string
  nom: string
  email: string
  telephone: string
  pays: string
  experience: string
  motivation: string
  temps: string
  budget: string
  autonomie: string
  projet_type: string
}

serve(async (req: Request) => {
  const preflight = handleCorsPreflight(req)
  if (preflight) return preflight
  const corsHeaders = getCorsHeaders(req)

  const jsonResponse = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Méthode non autorisée.' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const resendKey = Deno.env.get('RESEND_API_KEY') ?? ''

  if (!supabaseUrl || !serviceKey || !resendKey) {
    console.error('[submit-diagnostic] Variables d\'environnement manquantes')
    return jsonResponse(500, { ok: false, error: 'Configuration serveur incomplète.' })
  }

  let body: DiagnosticSubmission
  try {
    body = (await req.json()) as DiagnosticSubmission
  } catch {
    return jsonResponse(400, { ok: false, error: 'JSON invalide.' })
  }

  const {
    prenom,
    nom,
    email,
    telephone,
    pays,
    experience,
    motivation,
    temps,
    budget,
    autonomie,
    projet_type,
  } = body

  if (!prenom || !nom || !email || !telephone || !pays) {
    return jsonResponse(400, { ok: false, error: 'Informations de contact requises.' })
  }

  // 1. Calcul du Score de Sérieux (Max 20 points)
  let score = 0

  // Expérience business (Max 4 pts)
  if (experience.includes('business actif')) score += 4
  else if (experience.includes('freelance ou salarié')) score += 3
  else if (experience.includes('déjà essayé')) score += 3
  else score += 1 // Je pars de zéro

  // Motivation principale (Max 4 pts)
  if (motivation.includes('revenus durables') || motivation.includes('liberté')) score += 4
  else if (motivation.includes('Accélération') || motivation.includes('gagner du temps')) score += 3
  else if (motivation.includes('curiosité')) score += 2
  else score += 0 // Argent rapide sans effort (red flag)

  // Temps disponible (Max 4 pts)
  if (temps.includes('Plus de 20 heures') || temps.includes('Plus de 15 heures')) score += 4
  else if (temps.includes('10 à 20 heures') || temps.includes('5 à 15 heures')) score += 3
  else if (temps.includes('5 à 10 heures')) score += 2
  else score += 0 // Moins de 5 heures

  // Budget (Max 4 pts)
  if (budget.includes('Plus de 3 000') || budget.includes('3 000')) score += 4
  else if (budget.includes('1 500 à 3 000')) score += 3
  else if (budget.includes('500 à 1 500')) score += 2
  else score += 0 // Moins de 500 €

  // Autonomie / Mentorat face au blocage (Max 4 pts)
  if (autonomie.includes('mentor') || autonomie.includes('guider')) score += 4
  else if (autonomie.includes('chercher') || autonomie.includes('seul')) score += 3
  else score += 0 // Abandonne / découragement

  // 2. Détection pays occidental
  const pLower = pays.toLowerCase()
  const hasWesternName =
    pLower.includes('france') ||
    pLower.includes('canada') ||
    pLower.includes('belgi') ||
    pLower.includes('suiss') ||
    pLower.includes('luxem') ||
    pLower.includes('monaco') ||
    pLower.includes('andorr') ||
    pLower.includes('europe') ||
    pLower.includes('états-unis') ||
    pLower.includes('usa') ||
    pLower.includes('united states')

  const telClean = telephone.replace(/\s+/g, '')
  const hasWesternTel =
    telClean.startsWith('+33') || // France
    telClean.startsWith('+32') || // Belgique
    telClean.startsWith('+41') || // Suisse
    telClean.startsWith('+1') ||  // Canada / USA
    telClean.startsWith('+352') || // Luxembourg
    telClean.startsWith('0033') ||
    telClean.startsWith('0032') ||
    telClean.startsWith('0041') ||
    telClean.startsWith('001') ||
    telClean.startsWith('00352') ||
    (telClean.startsWith('06') && telClean.length === 10) || // Mobile France
    (telClean.startsWith('07') && telClean.length === 10) || // Mobile France
    (telClean.startsWith('01') && telClean.length === 10) ||
    (telClean.startsWith('02') && telClean.length === 10) ||
    (telClean.startsWith('03') && telClean.length === 10) ||
    (telClean.startsWith('04') && telClean.length === 10) ||
    (telClean.startsWith('05') && telClean.length === 10)

  const isWestern = hasWesternName || hasWesternTel

  // 3. Critères de qualification cible
  const isBudgetValid = !budget.includes('Moins de 500')
  const isQualified = score >= 12 && isWestern && isBudgetValid

  // 4. Libellé du profil
  let profileTitle = 'À développer'
  let profileColor = '#EF4444' // rouge
  let evaluation = ''
  let recs: string[] = []

  if (score >= 16) {
    profileTitle = 'Elite / Excellent'
    profileColor = '#10B981' // émeraude
    evaluation = 'Votre profil est exceptionnel. Vous disposez de toutes les clés (motivation élevée, autonomie technique, temps et budget adaptés) pour réussir le lancement de votre business avec l\'IA. C\'est le moment parfait pour vous lancer avec une structure professionnelle.'
    recs = [
      'Validez votre idée de positionnement en profitant de notre accompagnement sur-mesure.',
      'Implémentez rapidement vos premiers agents IA pour automatiser 80% de vos tâches répétitives.',
      'Lancez une stratégie d\'acquisition organique ciblée à forte valeur ajoutée.'
    ]
  } else if (score >= 12) {
    profileTitle = 'Très Bon / Qualifié'
    profileColor = '#3B82F6' // bleu
    evaluation = 'Votre profil est très prometteur. Vous avez la motivation requise et êtes prêt à vous investir sérieusement. Il vous manque cependant un plan d\'action structuré pas à pas pour éviter de vous disperser et maximiser votre rentabilité.'
    recs = [
      'Structurez une offre de service claire et testez-la auprès d\'un échantillon de clients cibles.',
      'Formez-vous aux bases des prompts avancés et aux workflows automatiques (n8n/Make).',
      'Établissez un planning de travail hebdomadaire régulier d\'au moins 10 heures.'
    ]
  } else {
    profileTitle = 'Débutant / À consolider'
    profileColor = '#F59E0B' // ambre / orange
    evaluation = 'Votre profil montre un intérêt certain pour le business et l\'IA, mais vous avez besoin de consolider vos bases et de valider votre discipline personnelle avant de vous engager dans un accompagnement premium. Commencer par des ressources communautaires est la meilleure option.'
    recs = [
      'Rejoignez la communauté "Le Club IA" pour échanger avec d\'autres membres et vous inspirer de leurs projets.',
      'Suivez les formations de base offertes pour comprendre le potentiel des outils IA.',
      'Prenez le temps d\'économiser ou de libérer du temps pour vos futurs projets entrepreneuriaux.'
    ]
  }

  // 5. Enregistrement dans la base de données
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { error: dbError } = await sb.from('accompagnement_candidatures').insert([
    {
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      telephone: telephone.trim(),
      pays: pays.trim(),
      projet_type: projet_type || 'Non défini',
      projet_ia: motivation || 'Non défini',
      projet_raison: autonomie || 'Non défini',
      projet_blocage: experience || 'Non défini',
      deja_essaie: experience.includes('déjà essayé') || experience.includes('business actif'),
      deja_essaie_details: experience,
      statut_actuel: experience,
      heures_semaine: temps,
      objectif_12m: 'Lancer un business rentable grâce à l\'IA',
      pret_investir: isBudgetValid ? 'Oui' : 'Non',
      budget: budget,
      candidat_raison: `Score: ${score}/20, Pays: ${pays}, Téléphone: ${telephone}`,
      status: isQualified ? 'Qualifié' : 'Nouveau',
      score: score,
      qualified: isQualified,
      is_western: isWestern,
      notes: `Diagnostic automatique : Score = ${score}/20. Pays Occidental = ${isWestern ? 'Oui' : 'Non'}. Qualifié = ${isQualified ? 'Oui' : 'Non'}.`
    }
  ])

  if (dbError) {
    console.error('[submit-diagnostic] Erreur insertion base de données:', dbError)
  }

  // 6. Envoi des emails via Resend
  const isUseSandbox = !resendKey.startsWith('re_') // fallback automatique
  const fromEmail = isUseSandbox ? FROM_SANDBOX : FROM_DEFAULT

  // A. Email de compte-rendu au prospect
  const userHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Votre Diagnostic Business IA</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #F9FAFB; color: #111827; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 24px; }
          .card { background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .logo { text-align: center; margin-bottom: 24px; font-weight: bold; font-size: 24px; letter-spacing: -0.5px; color: #000000; }
          .badge { display: inline-block; padding: 8px 16px; border-radius: 9999px; font-weight: bold; font-size: 14px; margin-bottom: 20px; color: #FFFFFF; }
          h1 { font-size: 22px; font-weight: 800; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 15px; line-height: 1.6; color: #4B5563; margin-top: 0; margin-bottom: 16px; }
          .score-box { background: #F3F4F6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .score-num { font-size: 40px; font-weight: 900; color: ${profileColor}; margin: 0; }
          .score-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px; margin-top: 4px; }
          .recommendations { margin-top: 24px; padding-top: 24px; border-t: 1px solid #E5E7EB; }
          .rec-item { display: flex; align-items: flex-start; margin-bottom: 12px; font-size: 14px; line-height: 1.5; color: #374151; }
          .rec-bullet { font-weight: bold; color: ${profileColor}; margin-right: 8px; font-size: 16px; }
          .cta-button { display: block; text-align: center; background-color: #000000; color: #FFFFFF !important; text-decoration: none; padding: 14px 24px; border-radius: 12px; font-weight: bold; font-size: 15px; margin-top: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9CA3AF; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="logo">Le Club IA</div>
            <div style="text-align: center;">
              <span class="badge" style="background-color: ${profileColor};">${profileTitle}</span>
            </div>
            <h1>Félicitations pour votre diagnostic, ${prenom} !</h1>
            <p>Nous avons analysé vos réponses. Ce diagnostic évalue votre niveau de préparation actuel pour lancer ou accélérer un business en ligne en tirant parti de l'intelligence artificielle.</p>
            
            <div class="score-box">
              <div class="score-num">${score}/20</div>
              <div class="score-label">Score d'Éligibilité Business IA</div>
            </div>
            
            <p><strong>Notre évaluation :</strong></p>
            <p>${evaluation}</p>
            
            <div class="recommendations">
              <h3 style="font-size: 16px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Vos recommandations personnalisées :</h3>
              ${recs.map(r => `
                <div class="rec-item">
                  <span class="rec-bullet">✓</span>
                  <span>${r}</span>
                </div>
              `).join('')}
            </div>

            ${isQualified ? `
              <p style="margin-top: 24px;"><strong>Étape Suivante :</strong> Si tu souhaites discuter d'un accompagnement avec moi pour lancer ton business en ligne grâce à l'IA, tu peux cliquer ci-dessous pour qu'on en parle en direct sur WhatsApp. Nous verrons ensemble s'il est possible qu'on travaille ensemble (je te le dirai honnêtement si ce n'est pas possible).</p>
              <a href="https://wa.me/33744125798?text=${encodeURIComponent(`Bonjour Ghislain, je viens de passer le diagnostic IA (Mon score : ${score}/20). J'aimerais échanger sur mon projet d'accompagnement.`)}" class="cta-button" target="_blank">Discuter sur WhatsApp</a>
            ` : `
              <p style="margin-top: 24px;"><strong>Étape Suivante :</strong> Pour vous aider à bâtir des bases entrepreneuriales solides et à maîtriser l'IA à votre rythme, rejoignez gratuitement notre communauté en ligne de créateurs.</p>
              <a href="https://leclub-ia.com" class="cta-button">Rejoindre la communauté</a>
            `}
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} Le Club IA • Tous droits réservés.
          </div>
        </div>
      </body>
    </html>
  `

  // B. Email d'alerte pour l'administrateur
  const adminHtml = `
    <h2>Nouveau diagnostic soumis !</h2>
    <p><strong>Candidat :</strong> ${prenom} ${nom}</p>
    <p><strong>Email :</strong> ${email}</p>
    <p><strong>Téléphone :</strong> <a href="https://wa.me/${telephone.replace(/\+/g, '')}">${telephone}</a> (Cliquer pour ouvrir WhatsApp)</p>
    <p><strong>Pays :</strong> ${pays} (Occidental : ${isWestern ? 'OUI' : 'NON'})</p>
    <p><strong>Score global :</strong> <strong style="font-size: 20px; color: ${profileColor};">${score}/20</strong> (${profileTitle})</p>
    <p><strong>Statut de qualification :</strong> ${isQualified ? '<span style="color: green; font-weight: bold;">QUALIFIÉ (CIBLE PREMIUM)</span>' : '<span style="color: red;">NON QUALIFIÉ (COMMUNAUTÉ)</span>'}</p>
    <hr />
    <h3>Détails des réponses :</h3>
    <ul>
      <li><strong>Activité souhaitée :</strong> ${projet_type}</li>
      <li><strong>Motivation principale :</strong> ${motivation}</li>
      <li><strong>Expérience :</strong> ${experience}</li>
      <li><strong>Temps hebdomadaire :</strong> ${temps}</li>
      <li><strong>Budget :</strong> ${budget}</li>
      <li><strong>Réaction face au blocage :</strong> ${autonomie}</li>
    </ul>
    <p><em>Cette candidature a été automatiquement enregistrée dans votre dashboard admin.</em></p>
  `

  // Envoi email au prospect
  try {
    const resUser = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `Votre Diagnostic Business IA : ${score}/20`,
        html: userHtml,
        reply_to: REPLY_TO,
      }),
    })
    if (!resUser.ok) {
      console.error('[submit-diagnostic] Erreur envoi email prospect:', await resUser.text())
    }
  } catch (err) {
    console.error('[submit-diagnostic] Exception email prospect:', err)
  }

  // Envoi email à l'admin
  try {
    const resAdmin = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ADMIN_EMAIL,
        subject: `[Diagnostic IA] ${prenom} ${nom} : ${score}/20 (${isQualified ? 'QUALIFIÉ' : 'NON QUALIFIÉ'})`,
        html: adminHtml,
        reply_to: REPLY_TO,
      }),
    })
    if (!resAdmin.ok) {
      console.error('[submit-diagnostic] Erreur envoi email admin:', await resAdmin.text())
    }
  } catch (err) {
    console.error('[submit-diagnostic] Exception email admin:', err)
  }

  return jsonResponse(200, {
    ok: true,
    score,
    qualified: isQualified,
    isWestern,
    profileTitle,
    profileColor,
    evaluation,
    recommendations: recs,
  })
})
