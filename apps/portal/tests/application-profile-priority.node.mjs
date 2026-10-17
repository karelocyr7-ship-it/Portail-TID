import test from "node:test";
import assert from "node:assert/strict";
import {
  orderApplicationProfiles,
  applicationProfileAccess,
} from "../lib/application-profile-priority.js";

const cases = [
  ["REVUE-PDV", "sup_orange", "ro"],
  ["CASH-RECON", "CASH_MANAGER", "DAF"],
  ["TDB", "SUPERVISOR", "MANAGER"],
  ["GPARC", "CHAUFFEUR", "CHAUFFEUR_GESTIONNAIRE"],
  ["MDM", "OBSERVER", "USER"],
  ["ATF", "OBSERVER_LIMITED", "USER"],
  ["RECRUTEMENT", "RECRUT_OCI_SUPERVISEUR", "RECRUT_OCI_RO"],
];
for (const [application, field, manager] of cases) {
  test(`${application}: profile choice is independent of assignment order`, () => {
    const profiles = [
      { key: field, displayOrder: 0 },
      { key: manager, displayOrder: 99 },
    ];
    const snapshot = structuredClone(profiles);
    assert.deepEqual(orderApplicationProfiles(application, profiles), [
      manager,
      field,
    ]);
    assert.deepEqual(
      orderApplicationProfiles(application, [...profiles].reverse()),
      [manager, field],
    );
    assert.deepEqual(profiles, snapshot);
    // A single field assignment never confers a manager or administrator role.
    assert.deepEqual(orderApplicationProfiles(application, [profiles[0]]), [
      field,
    ]);
    assert.deepEqual(orderApplicationProfiles(application, []), []);
  });
}

test("custom applications use catalog order and a stable key tie-break", () => {
  const profiles = [
    { key: "Z", displayOrder: 2 },
    { key: "B", displayOrder: 1 },
    { key: "A", displayOrder: 1 },
  ];
  assert.deepEqual(orderApplicationProfiles("CUSTOM", profiles), [
    "A",
    "B",
    "Z",
  ]);
  assert.deepEqual(orderApplicationProfiles("CUSTOM", profiles.reverse()), [
    "A",
    "B",
    "Z",
  ]);
});

test("unknown profiles remain present but cannot displace a known manager", () => {
  const profiles = [
    { key: "CUSTOM", displayOrder: -1 },
    { key: "ro", displayOrder: 3 },
  ];
  assert.deepEqual(orderApplicationProfiles("REVUE-PDV", profiles), [
    "ro",
    "CUSTOM",
  ]);
});

test("an application never inherits the role priority of another application", () => {
  assert.deepEqual(
    orderApplicationProfiles("CUSTOM", [
      { key: "ADMIN", displayOrder: 8 },
      { key: "ro", displayOrder: 0 },
    ]),
    ["ro", "ADMIN"],
  );
});

test("inactive users and removed assignments never authorize a profile", () => {
  const roles = [{ key: "ADMIN", displayOrder: 0 }];
  assert.deepEqual(applicationProfileAccess("TDB", false, roles), {
    profiles: [],
    primaryProfile: null,
    authorized: false,
  });
  assert.equal(applicationProfileAccess("TDB", true, []).authorized, false);
});

test("SSO and queued provisioning select the same current assignment", () => {
  const current = [
    { key: "sup_orange", displayOrder: 0 },
    { key: "ro", displayOrder: 5 },
  ];
  assert.deepEqual(applicationProfileAccess("REVUE-PDV", true, current), {
    profiles: ["ro", "sup_orange"],
    primaryProfile: "ro",
    authorized: true,
  });
});
