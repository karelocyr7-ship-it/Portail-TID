import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(
  new URL("../components/powered-by.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8",
);
test("footer SEPTNEX : libellé, lien HTTPS et ouverture sûre", () => {
  assert.doesNotMatch(component, /Powered by/);
  assert.match(component, /alt="SEPTNEX"/);
  assert.match(component, /src="\/branding\/septnex-signature.png"/);
  assert.match(component, /width=\{96\}/);
  assert.match(component, /height=\{60\}/);
  assert.match(component, /loading="eager"/);
  assert.match(component, /href="https:\/\/septnex.com"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /<footer/);
});
test("logo centré sans rétrécissement du footer", () => {
  const css = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /\.powered-by a\s*\{[^}]*flex-direction: column;[^}]*align-items: center;/,
  );
  assert.match(css, /\.powered-by\s*\{[^}]*flex-shrink: 0;/);
});
test("footer présent une seule fois dans le layout partagé", () => {
  assert.equal(layout.split("<PoweredBy />").length - 1, 1);
  assert.ok(layout.indexOf("<PoweredBy />") > layout.indexOf("{children}"));
});
test("logo seul présent dans les deux thèmes de connexion Keycloak", () => {
  for (const theme of ["tad-login", "tad-login-v2"]) {
    const template = readFileSync(
      new URL(
        `../../../infrastructure/keycloak/themes/${theme}/login/footer.ftl`,
        import.meta.url,
      ),
      "utf8",
    );
    assert.match(template, /<#macro content>/);
    assert.match(template, /href="https:\/\/septnex.com"/);
    assert.doesNotMatch(template, /Powered by/);
    assert.match(template, /alt="SEPTNEX"/);
    assert.match(template, /flex-direction: column; align-items: center;/);
    assert.match(
      template,
      /\$\{url.resourcesPath\}\/img\/septnex-signature.png/,
    );
    assert.deepEqual(
      readFileSync(
        new URL(
          `../../../infrastructure/keycloak/themes/${theme}/login/resources/img/septnex-signature.png`,
          import.meta.url,
        ),
      ),
      readFileSync(
        new URL("../public/branding/septnex-signature.png", import.meta.url),
      ),
    );
  }
});
