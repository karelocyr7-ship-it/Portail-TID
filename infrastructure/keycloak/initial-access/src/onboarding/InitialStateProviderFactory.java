package onboarding;

import java.util.List;
import org.keycloak.Config;
import org.keycloak.models.*;
import org.keycloak.connections.jpa.entityprovider.*;

public class InitialStateProviderFactory implements JpaEntityProviderFactory {
    public String getId() { return "tad-initial-access"; }
    public void init(Config.Scope config) {}
    public void postInit(KeycloakSessionFactory factory) {}
    public void close() {}
    public JpaEntityProvider create(KeycloakSession session) {
        return new JpaEntityProvider() {
            public List<Class<?>> getEntities() { return List.of(InitialState.class); }
            public String getChangelogLocation() { return "META-INF/tad-initial-access.xml"; }
            public String getFactoryId() { return "tad-initial-access"; }
            public void close() {}
        };
    }
}
