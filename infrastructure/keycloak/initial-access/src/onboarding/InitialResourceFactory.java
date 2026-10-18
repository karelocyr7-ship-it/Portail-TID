package onboarding;

import org.keycloak.Config;
import org.keycloak.models.*;
import org.keycloak.services.resource.*;

public class InitialResourceFactory implements RealmResourceProviderFactory {
    public String getId() { return "tad-initial-access"; }
    public void init(Config.Scope config) {}
    public void postInit(KeycloakSessionFactory factory) {}
    public void close() {}
    public RealmResourceProvider create(KeycloakSession session) {
        return new RealmResourceProvider() {
            public Object getResource() { return new InitialResource(session); }
            public void close() {}
        };
    }
}
