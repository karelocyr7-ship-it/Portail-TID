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
  assert.match(component, /Powered by SEPTNEX/);
  assert.match(component, /href="https:\/\/septnex.com"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /<footer/);
});
test("footer présent une seule fois dans le layout partagé", () => {
  assert.equal(layout.split("<PoweredBy />").length - 1, 1);
  assert.ok(layout.indexOf("<PoweredBy />") > layout.indexOf("{children}"));
});
test("mention présente dans les deux thèmes de connexion Keycloak", () => {
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
    assert.match(template, /Powered by SEPTNEX/);
  }
});
