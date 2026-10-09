type StoredPortalIdentity = {
  keycloakSubject: string;
  email: string | null;
};

type KeycloakIdentity = {
  subject: string;
  username?: string;
  email?: string;
  emailVerified?: boolean;
};

function normalizedEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();
  return normalized?.includes("@") ? normalized : undefined;
}

export function trustedIdentityEmail(identity: KeycloakIdentity) {
  return (
    normalizedEmail(identity.username) ??
    (identity.emailVerified ? normalizedEmail(identity.email) : undefined)
  );
}

export function canAutomaticallyReconcileSubject(
  stored: StoredPortalIdentity,
  identity: KeycloakIdentity,
) {
  const trustedEmail = trustedIdentityEmail(identity);
  const storedEmail = normalizedEmail(stored.email);
  const placeholderSubject = normalizedEmail(stored.keycloakSubject);
  return Boolean(
    identity.subject &&
    trustedEmail &&
    storedEmail === trustedEmail &&
    placeholderSubject === trustedEmail &&
    stored.keycloakSubject !== identity.subject,
  );
}
