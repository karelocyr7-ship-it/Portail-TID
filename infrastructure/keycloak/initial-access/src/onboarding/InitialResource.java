package onboarding;

import jakarta.persistence.EntityManager;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import java.util.*;
import org.keycloak.credential.CredentialProvider;
import org.keycloak.credential.PasswordCredentialProvider;
import org.keycloak.credential.PasswordCredentialProviderFactory;
import org.keycloak.credential.hash.PasswordHashProvider;
import org.keycloak.models.*;
import org.keycloak.models.cache.UserCache;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.util.JsonSerialization;

@jakarta.ws.rs.ext.Provider
public class InitialResource {
    private final KeycloakSession session;
    public InitialResource(KeycloakSession session) { this.session = session; }
    public static class Input {
        public String operationId, sageId, email, firstName, lastName, temporaryPassword, expectedSubject;
        public int generation;
        public boolean allowPendingExisting;
    }
    private Response reply(String status, String subject, int http) {
        Map<String, Object> body = new HashMap<>(); body.put("status", status);
        if (subject != null) body.put("subject", subject);
        return Response.status(http).entity(body).header("Cache-Control", "no-store").build();
    }
    private boolean authorized(RealmModel realm) {
        String clientId = System.getenv("TAD_INITIAL_ACCESS_CLIENT_ID");
        if (!Guard.applies(realm) || clientId == null || clientId.isBlank()) return false;
        var auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
        if (auth == null || !auth.user().isEnabled() || !clientId.equals(auth.token().getIssuedFor())) return false;
        ClientModel client = realm.getClientByClientId(clientId);
        ClientModel management = realm.getClientByClientId("realm-management");
        return client != null && management != null
            && client.getId().equals(auth.user().getServiceAccountClientLink())
            && auth.user().hasRole(management.getRole("manage-users"));
    }
    private static boolean uuid(String value) {
        try { return value != null && UUID.fromString(value).toString().equals(value); }
        catch (IllegalArgumentException e) { return false; }
    }
    private static boolean text(String value, int min, int max) {
        return value != null && value.length() >= min && value.length() <= max && value.chars().noneMatch(Character::isISOControl);
    }
    @POST @Consumes("application/json") @Produces("application/json")
    public Response initialize(String raw) {
        RealmModel realm = session.getContext().getRealm();
        if (!authorized(realm)) return reply("FORBIDDEN", null, 403);
        if (!(session.getProvider(UserProvider.class) instanceof GuardedUserProvider))
            return reply("GUARD_UNAVAILABLE", null, 503);
        Input input;
        try {
            if (raw == null || raw.length() > 4096) return reply("INVALID_REQUEST", null, 400);
            input = JsonSerialization.readValue(raw, Input.class);
            if (!uuid(input.operationId) || input.generation < 1
                || input.sageId == null || !input.sageId.matches("^TID(?:P[SC]?|[SC])?\\d{3,}$") || input.sageId.length() > 64
                || !text(input.temporaryPassword, 20, 128) || !text(input.firstName, 1, 80) || !text(input.lastName, 1, 80)
                || (input.email != null && (!text(input.email, 3, 320) || !input.email.contains("@"))))
                return reply("INVALID_REQUEST", null, 400);
        } catch (Exception e) { return reply("INVALID_REQUEST", null, 400); }
        EntityManager em = Guard.em(session);
        try {
            Guard.lock(em, realm.getId() + ":" + input.sageId);
            UserProvider local = session.getProvider(UserProvider.class);
            UserModel user = local.getUserByUsername(realm, input.sageId.toLowerCase(Locale.ROOT));
            if (input.expectedSubject != null && (user == null || !input.expectedSubject.equals(user.getId())))
                return reply("IDENTITY_CONFLICT", null, 409);
            boolean created = user == null;
            if (created) {
                user = local.addUser(realm, null, input.sageId, true, false);
                user.setEnabled(true); user.setFirstName(input.firstName); user.setLastName(input.lastName);
                if (input.email != null) user.setEmail(input.email);
                user.setEmailVerified(false);
                user.setSingleAttribute("sageId", input.sageId); user.setSingleAttribute("employeeId", input.sageId);
                em.flush();
            }
            if (user.getFederationLink() != null) return reply("REVIEW_REQUIRED", user.getId(), 200);
            Guard.lock(em, user.getId());
            if (!user.isEnabled()) return reply("DISABLED", user.getId(), 200);
            InitialState state = Guard.state(em, realm, user.getId());
            var credentials = Guard.credentials(em, user.getId());
            if (state != null && state.activated) return reply("EXISTING_CREDENTIAL_PROTECTED", user.getId(), 200);
            boolean owned = state != null && state.operationId != null;
            if (owned) {
                if (credentials.size() != 1 || !state.credentialId.equals(credentials.get(0)[0])
                    || state.credentialVersion.intValue() != ((Number) credentials.get(0)[2]).intValue()
                    || !user.getRequiredActionsStream().anyMatch("UPDATE_PASSWORD"::equals))
                    return reply("EXISTING_CREDENTIAL_PROTECTED", user.getId(), 200);
                if (input.operationId.equals(state.operationId)) {
                    if (input.generation != state.generation) return reply("OPERATION_CONFLICT", user.getId(), 409);
                    var provider = (PasswordCredentialProvider) session.getProvider(CredentialProvider.class, PasswordCredentialProviderFactory.PROVIDER_ID);
                    PasswordCredentialModel stored = provider.getPassword(realm, user);
                    PasswordHashProvider hash = session.getProvider(PasswordHashProvider.class, stored.getPasswordCredentialData().getAlgorithm());
                    // Verify only: no login, no refresh token, no rehash, no session.
                    return reply(hash != null && hash.verify(input.temporaryPassword, stored) ? "READY" : "OPERATION_CONFLICT", user.getId(), 200);
                }
                if (input.generation <= state.generation) return reply("OPERATION_CONFLICT", user.getId(), 409);
            } else {
                if (!credentials.isEmpty()) return reply("EXISTING_CREDENTIAL_PROTECTED", user.getId(), 200);
                if (!created && (!input.allowPendingExisting || input.expectedSubject == null
                    || !user.getRequiredActionsStream().anyMatch("UPDATE_PASSWORD"::equals)))
                    return reply("REVIEW_REQUIRED", user.getId(), 200);
            }
            state = Guard.ensureState(em, realm, user.getId());
            session.setAttribute(Guard.INITIAL_WRITE, Boolean.TRUE);
            try {
                if (!user.credentialManager().updateCredential(UserCredentialModel.password(input.temporaryPassword)))
                    throw new IllegalStateException("INITIALIZATION_REFUSED");
            } finally { session.removeAttribute(Guard.INITIAL_WRITE); }
            user.addRequiredAction("UPDATE_PASSWORD");
            user.removeRequiredAction("VERIFY_EMAIL");
            em.flush();
            credentials = Guard.credentials(em, user.getId());
            if (credentials.size() != 1 || !"password".equals(credentials.get(0)[1])) throw new IllegalStateException("CREDENTIAL_STATE_CONFLICT");
            state.operationId = input.operationId;
            state.generation = input.generation;
            state.credentialId = (String) credentials.get(0)[0];
            state.credentialVersion = ((Number) credentials.get(0)[2]).intValue();
            state.activated = false;
            em.flush();
            UserCache cache = session.getProvider(UserCache.class);
            if (cache != null) cache.evict(realm, user);
            return reply("READY", user.getId(), 200);
        } catch (Exception e) {
            session.getTransactionManager().setRollbackOnly();
            // Intentionally no exception/body logging: inputs may contain secrets.
            return reply("INITIAL_ACCESS_UNAVAILABLE", null, 503);
        }
    }
}
