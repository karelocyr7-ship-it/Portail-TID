import { renderBaseLayout, escapeHtml } from "./base-layout";
import type { EmailTemplateName, EmailTemplateVariables, RenderedEmail } from "../types";

const value = (variables: EmailTemplateVariables, key: string, fallback: string) =>
  String(variables[key] ?? fallback);

export function renderTemplate(
  template: EmailTemplateName,
  variables: EmailTemplateVariables = {},
): RenderedEmail {
  const title = value(variables, "title", "Notification du portail");
  const message = value(variables, "message", "Une nouvelle information est disponible.");
  const actionUrl = variables.actionUrl ? String(variables.actionUrl) : "";
  const actionLabel = value(variables, "actionLabel", "Ouvrir le portail");
  const heading = template === "generic-notification" ? title : value(variables, "heading", title);
  const action = actionUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;background:#1d4ed8;color:#fff;padding:11px 18px;border-radius:7px;text-decoration:none;font-weight:bold">${escapeHtml(actionLabel)}</a></p><p style="font-size:12px;color:#667085">URL : ${escapeHtml(actionUrl)}</p>`
    : "";
  return renderBaseLayout(
    heading,
    `<p style="font-size:16px;line-height:1.6;white-space:pre-line">${escapeHtml(message)}</p>${action}`,
    `${message}${actionUrl ? `\n\n${actionLabel}: ${actionUrl}` : ""}`,
  );
}
