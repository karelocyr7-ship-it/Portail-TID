package onboarding;

import jakarta.persistence.EntityManager;
import org.keycloak.credential.CredentialModel;
import org.keycloak.models.*;
import org.keycloak.models.jpa.JpaUserProvider;

/** All local password writes share the resource's transaction lock. */
public class GuardedUserProvider extends JpaUserProvider {
    private final KeycloakSession session;
    public GuardedUserProvider(KeycloakSession session, EntityManager em) {
        super(session, em); this.session = session;
    }
    @Override public CredentialModel createCredential(RealmModel realm, UserModel user, CredentialModel credential) {
        if (!Guard.applies(realm) || !"password".equals(credential.getType()))
            return super.createCredential(realm, user, credential);
        Guard.lock(em, user.getId());
        if (Guard.credentials(em, user.getId()).stream().anyMatch(c -> "password".equals(c[1])))
            throw new ModelDuplicateException("PASSWORD_STATE_CHANGED");
        CredentialModel result = super.createCredential(realm, user, credential);
        em.flush();
        Guard.nativeMutation(session, em, realm, user.getId());
        return result;
    }
    @Override public void updateCredential(RealmModel realm, UserModel user, CredentialModel credential) {
        if (!Guard.applies(realm) || !"password".equals(credential.getType())) {
            super.updateCredential(realm, user, credential); return;
        }
        Guard.lock(em, user.getId());
        super.updateCredential(realm, user, credential);
        em.flush(); // Native optimistic credential version also rejects stale updates.
        Guard.nativeMutation(session, em, realm, user.getId());
    }
    @Override public boolean removeStoredCredential(RealmModel realm, UserModel user, String id) {
        if (!Guard.applies(realm)) return super.removeStoredCredential(realm, user, id);
        Guard.lock(em, user.getId());
        boolean password = Guard.credentials(em, user.getId()).stream()
            .anyMatch(c -> id.equals(c[0]) && "password".equals(c[1]));
        boolean removed = super.removeStoredCredential(realm, user, id);
        em.flush();
        if (removed && password) Guard.nativeMutation(session, em, realm, user.getId());
        return removed;
    }
}
