package com.hmdm.rest.resource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hmdm.persistence.CustomerDAO;
import com.hmdm.persistence.UnsecureDAO;
import com.hmdm.persistence.domain.Settings;
import com.hmdm.persistence.domain.User;
import com.hmdm.rest.filter.AuthFilter;
import com.hmdm.rest.json.view.user.UserView;
import com.hmdm.util.PasswordUtil;
import com.hmdm.util.BackgroundTaskRunnerService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;

import javax.inject.Inject;
import javax.inject.Named;
import javax.inject.Singleton;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/** OIDC bridge for the HMDM web session. Only existing HMDM users are admitted. */
@Singleton
@Path("/public/oidc")
public class OidcResource {
    private static final String STATE = "hmdm.oidc.state";
    private static final String NONCE = "hmdm.oidc.nonce";
    private static final String ID_TOKEN = "hmdm.oidc.id_token";
    private final ObjectMapper mapper = new ObjectMapper();
    private final SecureRandom random = new SecureRandom();
    private final UnsecureDAO userDAO;
    private final UnsecureDAO settingsDAO;
    private final CustomerDAO customerDAO;
    private final BackgroundTaskRunnerService taskRunner;
    private final String issuer;
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final boolean enabled;

    @Inject
    public OidcResource(UnsecureDAO userDAO, UnsecureDAO settingsDAO, CustomerDAO customerDAO,
                        BackgroundTaskRunnerService taskRunner,
                        @Named("oidc.issuer") String issuer,
                        @Named("oidc.client.id") String clientId,
                        @Named("oidc.client.secret") String clientSecret,
                        @Named("oidc.redirect.uri") String redirectUri,
                        @Named("oidc.enabled") boolean enabled) {
        this.userDAO = userDAO;
        this.settingsDAO = settingsDAO;
        this.customerDAO = customerDAO;
        this.taskRunner = taskRunner;
        this.issuer = trim(issuer);
        this.clientId = trim(clientId);
        this.clientSecret = clientSecret == null ? "" : clientSecret;
        this.redirectUri = trim(redirectUri);
        this.enabled = enabled && !this.issuer.isEmpty() && !this.clientId.isEmpty()
                && !this.clientSecret.isEmpty() && !this.redirectUri.isEmpty();
    }

    @GET
    @Path("/config")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Object> config() {
        Map<String, Object> result = new HashMap<>();
        result.put("enabled", enabled);
        return result;
    }

    @GET
    @Path("/start")
    public javax.ws.rs.core.Response start(@Context HttpServletRequest request) throws Exception {
        if (!enabled) return javax.ws.rs.core.Response.status(404).build();
        String state = randomToken();
        String nonce = randomToken();
        HttpSession session = request.getSession(true);
        session.setAttribute(STATE, state);
        session.setAttribute(NONCE, nonce);
        String location = issuer + "/protocol/openid-connect/auth?response_type=code"
                + "&client_id=" + enc(clientId)
                + "&redirect_uri=" + enc(redirectUri)
                + "&scope=" + enc("openid email profile")
                + "&state=" + enc(state)
                + "&nonce=" + enc(nonce);
        return javax.ws.rs.core.Response.seeOther(URI.create(location)).build();
    }

    @GET
    @Path("/callback")
    public javax.ws.rs.core.Response callback(@Context HttpServletRequest request,
                                               @javax.ws.rs.core.Context javax.ws.rs.core.UriInfo uriInfo) {
        if (!enabled) return javax.ws.rs.core.Response.status(404).build();
        try {
            String error = uriInfo.getQueryParameters().getFirst("error");
            if (error != null) return javax.ws.rs.core.Response.status(401).build();
            HttpSession session = request.getSession(false);
            String expectedState = session == null ? null : (String) session.getAttribute(STATE);
            String expectedNonce = session == null ? null : (String) session.getAttribute(NONCE);
            String state = uriInfo.getQueryParameters().getFirst("state");
            String code = uriInfo.getQueryParameters().getFirst("code");
            if (session == null || code == null || expectedState == null || expectedNonce == null
                    || !constantTimeEquals(expectedState, state)) {
                return javax.ws.rs.core.Response.status(400).build();
            }
            JsonNode token = exchangeCode(code);
            String idToken = text(token, "id_token");
            if (idToken == null) return javax.ws.rs.core.Response.status(401).build();
            Claims claims = verifyIdToken(idToken, expectedNonce);
            String email = claims.get("email", String.class);
            if (email == null || email.trim().isEmpty()) {
                email = claims.get("preferred_username", String.class);
            }
            if (email == null || email.trim().isEmpty()) return javax.ws.rs.core.Response.status(403).build();
            User user = userDAO.findByLoginOrEmail(email.trim());
            if (user == null) return javax.ws.rs.core.Response.status(403).build();
            establishSession(session, user);
            session.removeAttribute(STATE);
            session.removeAttribute(NONCE);
            session.setAttribute(ID_TOKEN, idToken);
            return javax.ws.rs.core.Response.seeOther(URI.create("/" )).build();
        } catch (Exception e) {
            return javax.ws.rs.core.Response.status(401).build();
        }
    }

    private void establishSession(HttpSession session, User user) {
        if (user.getAuthToken() == null || user.getAuthToken().isEmpty()) {
            user.setAuthToken(PasswordUtil.generateToken());
            user.setNewPassword(user.getPassword());
            userDAO.setUserNewPasswordUnsecure(user);
        }
        Settings settings = settingsDAO.getSettings(user.getCustomerId());
        if (settings != null && settings.isTwoFactor()) {
            session.setAttribute(AuthFilter.twoFactorNeeded, "true");
            user.setTwoFactor(true);
            user.setIdleLogout(settings.getIdleLogout());
        }
        user.setPassword(null);
        user.setSingleCustomer(userDAO.isSingleCustomer());
        session.setAttribute(AuthFilter.sessionCredentials, user);
        taskRunner.submitTask(() -> customerDAO.recordLastLoginTime(user.getCustomerId(), System.currentTimeMillis()));
    }

    private Claims verifyIdToken(String token, String expectedNonce) throws Exception {
        JsonNode header = mapper.readTree(Base64.getUrlDecoder().decode(token.split("\\.")[0]));
        String kid = text(header, "kid");
        JsonNode keys = mapper.readTree(read(issuer + "/protocol/openid-connect/certs")).get("keys");
        for (JsonNode key : keys) {
            if (kid.equals(text(key, "kid"))) {
                byte[] n = Base64.getUrlDecoder().decode(pad(text(key, "n")));
                byte[] e = Base64.getUrlDecoder().decode(pad(text(key, "e")));
                PublicKey publicKey = KeyFactory.getInstance("RSA").generatePublic(
                        new RSAPublicKeySpec(new BigInteger(1, n), new BigInteger(1, e)));
                Claims claims = Jwts.parser().setSigningKey(publicKey).parseClaimsJws(token).getBody();
                if (!issuer.equals(claims.getIssuer()) || !clientId.equals(claims.getAudience())
                        || !constantTimeEquals(expectedNonce, claims.get("nonce", String.class))) {
                    throw new SecurityException("OIDC claims rejected");
                }
                return claims;
            }
        }
        throw new SecurityException("OIDC key not found");
    }

    private JsonNode exchangeCode(String code) throws Exception {
        String body = "grant_type=authorization_code&code=" + enc(code)
                + "&client_id=" + enc(clientId) + "&client_secret=" + enc(clientSecret)
                + "&redirect_uri=" + enc(redirectUri);
        String response = request(issuer + "/protocol/openid-connect/token", "POST", body);
        return mapper.readTree(response);
    }

    private String read(String location) throws Exception { return request(location, "GET", null); }

    private String request(String location, String method, String body) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(location).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(5000);
        connection.setReadTimeout(5000);
        connection.setRequestProperty("Accept", "application/json");
        if (body != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            try (OutputStream output = connection.getOutputStream()) {
                output.write(body.getBytes(StandardCharsets.UTF_8));
            }
        }
        int status = connection.getResponseCode();
        InputStream input = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
        if (input == null) throw new SecurityException("OIDC empty response");
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int length;
        while ((length = input.read(buffer)) != -1) output.write(buffer, 0, length);
        if (status < 200 || status >= 300) throw new SecurityException("OIDC HTTP " + status);
        return new String(output.toByteArray(), StandardCharsets.UTF_8);
    }

    private String randomToken() {
        byte[] value = new byte[32];
        random.nextBytes(value);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value);
    }

    private static String trim(String value) { return value == null ? "" : value.replaceAll("/$", ""); }
    private static String enc(String value) throws Exception { return URLEncoder.encode(value, "UTF-8"); }
    private static String text(JsonNode node, String name) { JsonNode value = node == null ? null : node.get(name); return value == null || value.isNull() ? null : value.asText(); }
    private static String pad(String value) { return value + "===".substring((value.length() + 3) % 4); }
    private static boolean constantTimeEquals(String left, String right) { return left != null && right != null && MessageDigest.isEqual(left.getBytes(StandardCharsets.UTF_8), right.getBytes(StandardCharsets.UTF_8)); }
}
