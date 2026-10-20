package onboarding;

import jakarta.persistence.EntityManager;
import java.util.List;
import org.keycloak.models.*;
import org.keycloak.connections.jpa.JpaConnectionProvider;

final class Guard {
    static final String INITIAL_WRITE = "tad.initial-access.internal-write";
    static boolean applies(RealmModel realm) {
        return realm.getName().equals(System.getenv().getOrDefault("TAD_INITIAL_ACCESS_REALM", "tad-groupe"));
    }
    static EntityManager em(KeycloakSession session) {
        return session.getProvider(JpaConnectionProvider.class).getEntityManager();
    }
    static void lock(EntityManager em, String key) {
        // PostgreSQL transaction locks work across threads AND Keycloak instances.
        // No password or hash is used as a key. Lock is released on commit/rollback.
        em.createNativeQuery("select cast(pg_advisory_xact_lock(hashtextextended(:key, 0)) as text)")
            .setParameter("key", "tad-initial:" + key).getSingleResult();
    }
    static InitialState state(EntityManager em, RealmModel realm, String userId) {
        InitialState state = em.find(InitialState.class, userId);
        if (state != null) {
            em.refresh(state); // Never decide from a pre-lock persistence-context snapshot.
            if (!realm.getId().equals(state.realmId)) throw new IllegalStateException("REALM_MISMATCH");
        }
        return state;
    }
    static InitialState ensureState(EntityManager em, RealmModel realm, String userId) {
        InitialState state = state(em, realm, userId);
        if (state == null) {
            state = new InitialState(); state.userId = userId; state.realmId = realm.getId();
            em.persist(state); em.flush();
        }
        return state;
    }
    @SuppressWarnings("unchecked")
    static List<Object[]> credentials(EntityManager em, String userId) {
        // Native scalar query bypasses cached UserEntity.credentials collections.
        return em.createNativeQuery("select id, type, version from credential where user_id=:uid order by id")
            .setParameter("uid", userId).getResultList();
    }
    static void nativeMutation(KeycloakSession session, EntityManager em, RealmModel realm, String userId) {
        if (!Boolean.TRUE.equals(session.getAttribute(INITIAL_WRITE))) {
            InitialState state = ensureState(em, realm, userId);
            // Irreversible by onboarding, even if an administrator later removes the password.
            state.activated = true; em.flush();
        }
    }
}
