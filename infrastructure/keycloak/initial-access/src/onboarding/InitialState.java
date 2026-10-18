package onboarding;

import jakarta.persistence.*;

/** Non-secret operation metadata only. Never stores passwords or password hashes. */
@Entity
@Table(name = "TAD_INITIAL_ACCESS")
public class InitialState {
    @Id @Column(name = "USER_ID", length = 36) public String userId;
    @Column(name = "REALM_ID", length = 36, nullable = false) public String realmId;
    @Column(name = "OPERATION_ID", length = 36) public String operationId;
    @Column(name = "GENERATION", nullable = false) public int generation;
    @Column(name = "CREDENTIAL_ID", length = 36) public String credentialId;
    @Column(name = "CREDENTIAL_VERSION") public Integer credentialVersion;
    @Column(name = "ACTIVATED", nullable = false) public boolean activated;
}
