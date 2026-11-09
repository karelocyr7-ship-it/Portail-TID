ARG ATF_BASE_IMAGE=atf/traccar-custom:poi-default-off-20261109
FROM ${ATF_BASE_IMAGE} AS atf-runtime

FROM eclipse-temurin:21 AS build
COPY --from=atf-runtime /opt/traccar/tracker-server.jar /build/tracker-server.jar
COPY --from=atf-runtime /opt/traccar/lib /build/lib
COPY AtfProvisioningResource.java /build/src/org/traccar/api/resource/AtfProvisioningResource.java
RUN mkdir -p /build/classes \
    && javac -cp "/build/tracker-server.jar:/build/lib/*" \
        -d /build/classes \
        /build/src/org/traccar/api/resource/AtfProvisioningResource.java \
    && jar uf /build/tracker-server.jar -C /build/classes org/traccar/api/resource

FROM atf-runtime
COPY --from=build /build/tracker-server.jar /opt/traccar/tracker-server.jar
