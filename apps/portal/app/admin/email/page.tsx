"use client";

import { useEffect, useState } from "react";

type EmailStatus = {
  enabled: boolean;
  host: string;
  port: number;
  encryption: string;
  from: string;
  pending: number;
  failed: number;
  sent24h: number;
  lastTestSucceededAt: string | null;
  lastFailureAt: string | null;
};

export default function EmailAdministrationPage() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/admin/email", { cache: "no-store" });
    if (response.ok) setStatus((await response.json()) as EmailStatus);
  };
  useEffect(() => {
    let active = true;
    void fetch("/api/admin/email", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active && data) setStatus(data as EmailStatus);
      });
    return () => { active = false; };
  }, []);

  const test = async () => {
    if (!window.confirm("Envoyer un message de test à la destination configurée ?")) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ confirm: true }) });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setMessage(response.ok ? "Test SMTP envoyé." : data.error ?? "Le test SMTP a échoué.");
    setBusy(false);
    await refresh();
  };

  return (
    <div className="page-container admin-page">
      <section className="admin-hero"><div><p className="eyebrow light">Administration</p><h1>Paramètres e-mails.</h1><p>État du transport SMTP transactionnel du portail.</p></div></section>
      <section className="admin-stat-grid" aria-label="État SMTP">
        <div className="admin-stat-card"><span className="admin-stat-icon">✉</span><span><strong>{status?.enabled ? "Activé" : "Désactivé"}</strong><small>SMTP</small></span></div>
        <div className="admin-stat-card"><span className="admin-stat-icon">◌</span><span><strong>{status?.pending ?? "—"}</strong><small>En attente</small></span></div>
        <div className="admin-stat-card"><span className="admin-stat-icon orange">!</span><span><strong>{status?.failed ?? "—"}</strong><small>En échec</small></span></div>
        <div className="admin-stat-card"><span className="admin-stat-icon">↗</span><span><strong>{status?.sent24h ?? "—"}</strong><small>Envoyés (24 h)</small></span></div>
      </section>
      <section className="panel-card">
        <p className="eyebrow">Configuration non secrète</p>
        <h2>Serveur SMTP OVH</h2>
        <p>{status?.host ?? "—"}:{status?.port ?? "—"} · {status?.encryption ?? "—"}</p>
        <p>Expéditeur : {status?.from ?? "—"}</p>
        <button type="button" className="primary-button" onClick={() => void test()} disabled={busy || !status?.enabled}>{busy ? "Test en cours…" : "Tester la configuration SMTP"}</button>
        {message && <p role="status">{message}</p>}
      </section>
    </div>
  );
}
