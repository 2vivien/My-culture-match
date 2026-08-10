import { enqueueEmail } from './email.queue';

const TRANSLATIONS = {
  fr: {
    subject: 'Votre code de connexion My Culture Match',
    greeting: 'Bonjour',
    intro: 'Voici votre code de vérification. Il expire dans 5 minutes.',
    footer: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.',
  },
  en: {
    subject: 'Your My Culture Match sign-in code',
    greeting: 'Hello',
    intro: 'Here is your verification code. It expires in 5 minutes.',
    footer: 'If you did not request this, you can ignore this email.',
  },
  es: {
    subject: 'Tu código de inicio de sesión My Culture Match',
    greeting: 'Hola',
    intro: 'Aquí está tu código de verificación. Caduca en 5 minutos.',
    footer: 'Si no solicitaste este código, puedes ignorar este correo.',
  },
} as const;

export type Locale = keyof typeof TRANSLATIONS;

function buildHtml(locale: Locale, code: string): string {
  const t = TRANSLATIONS[locale];
  return `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <h2 style="color:#0f766e">My Culture Match</h2>
    <p>${t.greeting},</p>
    <p>${t.intro}</p>
    <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f0fdfa;border-radius:8px">${code}</div>
    <p style="color:#64748b;font-size:12px;margin-top:24px">${t.footer}</p>
  </div>`;
}

/** Envoie l'email OTP (asynchrone via BullMQ), i18n FR/EN/ES. */
export function sendOtpEmail(to: string, code: string, locale: Locale = 'fr'): Promise<void> {
  const t = TRANSLATIONS[locale];
  return enqueueEmail({
    to,
    subject: t.subject,
    html: buildHtml(locale, code),
  });
}

const EMAIL_CHANGE_TRANSLATIONS = {
  fr: {
    subject: 'Confirmez votre nouvelle adresse My Culture Match',
    intro: 'Voici le code pour confirmer votre nouveau email. Il expire dans 5 minutes.',
  },
  en: {
    subject: 'Confirm your new My Culture Match email',
    intro: 'Here is the code to confirm your new email. It expires in 5 minutes.',
  },
  es: {
    subject: 'Confirma tu nuevo email de My Culture Match',
    intro: 'Aquí está el código para confirmar tu nuevo email. Caduca en 5 minutos.',
  },
} as const;

/** Envoie l'email de confirmation de changement d'email. */
export function sendEmailChangeEmail(to: string, code: string, locale: Locale = 'fr'): Promise<void> {
  const t = EMAIL_CHANGE_TRANSLATIONS[locale];
  return enqueueEmail({
    to,
    subject: t.subject,
    html: `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
      <h2 style="color:#0f766e">My Culture Match</h2>
      <p>${t.intro}</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#f0fdfa;border-radius:8px">${code}</div>
    </div>`,
  });
}
