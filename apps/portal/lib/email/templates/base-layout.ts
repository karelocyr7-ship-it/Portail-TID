import type { RenderedEmail } from "../types";

const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function renderBaseLayout(title: string, content: string, text: string): RenderedEmail {
  const safeTitle = escapeHtml(title);
  const date = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(new Date());
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f7fb;color:#14213d;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px"><tr><td align="center"><table role="presentation" width="100%" style="max-width:620px;background:#fff;border-radius:12px;padding:28px;box-shadow:0 4px 18px rgba(20,33,61,.08)"><tr><td><p style="margin:0 0 8px;color:#1d4ed8;font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase">Portail TAD Groupe</p><h1 style="margin:0 0 22px;font-size:25px;color:#14213d">${safeTitle}</h1>${content}<hr style="border:0;border-top:1px solid #e5e7eb;margin:26px 0 16px"><p style="margin:0;color:#667085;font-size:12px">Message automatique envoyé le ${escapeHtml(date)} (Africa/Abidjan).</p><p style="margin:8px 0 0;font-size:12px"><a href="https://portail.tadgroupe.com" style="color:#1d4ed8">Accéder au portail.tadgroupe.com</a></p></td></tr></table></td></tr></table></body></html>`;
  return { html, text: `Portail TAD Groupe\n\n${title}\n\n${text}\n\nMessage automatique.\nhttps://portail.tadgroupe.com\n` };
}

export { escapeHtml };
