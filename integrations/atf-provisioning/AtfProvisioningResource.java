/*
 * Copyright 2026 TAD Groupe
 *
 * Licensed under the Apache License, Version 2.0.
 */
package org.traccar.api.resource;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.traccar.api.BaseResource;
import org.traccar.config.Config;
import org.traccar.helper.model.UserUtil;
import org.traccar.model.User;
import org.traccar.storage.StorageException;
import org.traccar.storage.query.Columns;
import org.traccar.storage.query.Condition;
import org.traccar.storage.query.Request;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Path("provisioning/users")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AtfProvisioningResource extends BaseResource {

    private static final String TOKEN_ENV = "ATF_PROVISIONING_TOKEN";
    private static final String TOKEN_HEADER = "x-sirh-provisioning-token";

    @Inject
    private Config config;

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProvisioningRequest(
            String application,
            @JsonProperty("sage_id") String sageId,
            String email,
            @JsonProperty("first_name") String firstName,
            @JsonProperty("last_name") String lastName,
            String profile,
            Boolean enabled) {
    }

    @POST
    @PermitAll
    public Response provision(
            @HeaderParam(TOKEN_HEADER) String suppliedToken,
            ProvisioningRequest body) throws StorageException {
        String expectedToken = System.getenv(TOKEN_ENV);
        if (expectedToken == null || expectedToken.isBlank()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE).build();
        }
        if (!matchesToken(suppliedToken, expectedToken)) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        if (body == null || !"ATF".equals(body.application()) || body.enabled() == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        String sageId = trimToNull(body.sageId());
        String email = trimToNull(body.email());
        if (sageId == null && email == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        List<User> users = storage.getObjects(User.class, new Request(new Columns.All()));
        List<User> sageMatches = sageId == null ? List.of() : users.stream()
                .filter(user -> normalized(user.getLogin()).equals(normalized(sageId))).toList();
        List<User> emailMatches = email == null ? List.of() : users.stream()
                .filter(user -> normalized(user.getEmail()).equals(normalized(email))).toList();
        if (sageMatches.size() > 1 || emailMatches.size() > 1) {
            return Response.status(Response.Status.CONFLICT).build();
        }
        User sageUser = sageMatches.isEmpty() ? null : sageMatches.get(0);
        User emailUser = emailMatches.isEmpty() ? null : emailMatches.get(0);
        if (sageUser != null && emailUser != null && sageUser.getId() != emailUser.getId()) {
            return Response.status(Response.Status.CONFLICT).build();
        }
        User user = sageUser != null ? sageUser : emailUser;

        if (!body.enabled()) {
            if (user != null) {
                user.setDisabled(true);
                storage.updateObject(user, new Request(new Columns.Include("disabled"),
                        new Condition.Equals("id", user.getId())));
            }
            return Response.ok(Map.of("status", user == null ? "NO_ACCOUNT" : "DISABLED")).build();
        }

        Profile profile = Profile.parse(body.profile());
        if (profile == null || email == null) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        String name = joinName(body.firstName(), body.lastName());
        if (name.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }

        if (user == null) {
            user = new User();
            UserUtil.setUserDefaults(user, config);
        } else if (sageId != null && trimToNull(user.getLogin()) != null
                && !normalized(user.getLogin()).equals(normalized(sageId))) {
            return Response.status(Response.Status.CONFLICT).build();
        }

        user.setName(name);
        user.setEmail(email);
        if (sageId != null) {
            user.setLogin(sageId);
        }
        user.setFixedEmail(true);
        user.setDisabled(false);
        profile.apply(user);

        if (user.getId() == 0) {
            user.setId(storage.addObject(user, new Request(new Columns.Exclude("id"))));
        } else {
            storage.updateObject(user, new Request(new Columns.Include(
                    "name", "email", "login", "fixedEmail", "disabled", "administrator",
                    "readonly", "limitCommands", "disableReports"),
                    new Condition.Equals("id", user.getId())));
        }
        return Response.ok(Map.of("status", "SYNCHRONIZED")).build();
    }

    private static boolean matchesToken(String supplied, String expected) {
        if (supplied == null) {
            return false;
        }
        return MessageDigest.isEqual(
                supplied.getBytes(StandardCharsets.UTF_8), expected.getBytes(StandardCharsets.UTF_8));
    }

    private static String normalized(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private static String joinName(String firstName, String lastName) {
        String first = trimToNull(firstName);
        String last = trimToNull(lastName);
        if (first == null) {
            return last == null ? "" : last;
        }
        return last == null ? first : first + " " + last;
    }

    private enum Profile {
        ADMIN,
        USER,
        OBSERVER,
        OBSERVER_LIMITED;

        static Profile parse(String value) {
            if (value == null) {
                return null;
            }
            try {
                return valueOf(value.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                return null;
            }
        }

        void apply(User user) {
            user.setAdministrator(this == ADMIN);
            user.setReadonly(this == OBSERVER || this == OBSERVER_LIMITED);
            user.setLimitCommands(this == OBSERVER_LIMITED);
            user.setDisableReports(this == OBSERVER_LIMITED);
        }
    }
}
