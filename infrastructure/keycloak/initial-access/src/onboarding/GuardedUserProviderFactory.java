package onboarding;

import org.keycloak.models.*;
import org.keycloak.models.jpa.JpaUserProviderFactory;

/** Version-pinned SPI override; no upstream classes/sources/database tables patched. */
public class GuardedUserProviderFactory extends JpaUserProviderFactory {
    @Override public int order() { return super.order() + 100; }
    @Override public UserProvider create(KeycloakSession session) {
        return new GuardedUserProvider(session, Guard.em(session));
    }
}
