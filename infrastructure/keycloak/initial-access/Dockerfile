FROM quay.io/keycloak/keycloak:26.6.2 AS keycloak
FROM gradle:9.5.1-jdk21 AS compiler
USER root
WORKDIR /build
COPY --from=keycloak /opt/keycloak/lib/lib/main /classpath
COPY src ./src
COPY resources ./resources
RUN mkdir classes && javac -encoding UTF-8 --release 21 -cp '/classpath/*' -d classes src/onboarding/*.java \
    && jar --create --file tad-initial-access.jar -C classes . -C resources .
FROM keycloak
COPY --from=compiler --chown=keycloak:keycloak /build/tad-initial-access.jar /opt/keycloak/providers/tad-initial-access.jar
RUN /opt/keycloak/bin/kc.sh build --db=postgres --health-enabled=true --http-relative-path=/auth
