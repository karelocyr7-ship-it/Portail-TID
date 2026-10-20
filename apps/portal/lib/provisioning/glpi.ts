type Identity = {
  email: string | null;
  sageEmployeeId: string | null;
  employeeId: string | null;
  displayName: string;
  active?: boolean;
  glpiAccess?: boolean;
};
type Row = {
  id: number;
  name?: string;
  email?: string;
  users_id?: number;
  is_active?: number;
  is_deleted?: number;
  registration_number?: string;
};

/** GLPI REST v1: create identities only. Existing local profiles are never changed. */
export async function provisionGlpiAccount(user: Identity) {
  const base = process.env.GLPI_API_URL?.trim();
  const appToken = process.env.GLPI_API_APP_TOKEN?.trim();
  const userToken = process.env.GLPI_API_USER_TOKEN?.trim();
  const attribute = process.env.GLPI_LOGIN_ATTRIBUTE?.trim();
  if (!base || !appToken || !userToken || !attribute)
    return "WAITING_CONFIG" as const;
  const url = new URL(base);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      "GLPI API requires an HTTPS URL without credentials or query",
    );
  if (!["email", "sageId"].includes(attribute))
    throw new Error("Invalid GLPI login attribute");
  const email = user.email?.trim().toLowerCase();
  const login =
    attribute === "email" ? email : (user.sageEmployeeId ?? user.employeeId);
  if (!email || !login) throw new Error("GLPI identity is incomplete");
  const enabled = user.active !== false && user.glpiAccess !== false;
  const endpoint = base.replace(/\/$/, "");
  let session: string | undefined;
  async function call(path: string, init?: RequestInit) {
    let response: Response;
    try {
      response = await fetch(`${endpoint}/${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "App-Token": appToken!,
          ...(session
            ? { "Session-Token": session }
            : { Authorization: `user_token ${userToken}` }),
        },
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new Error("GLPI API connection failed");
    }
    // Never propagate response bodies, URLs or authentication material into logs.
    if (!response.ok) throw new Error(`GLPI API HTTP ${response.status}`);
    return response;
  }
  async function json(response: Response) {
    try {
      return await response.json();
    } catch {
      throw new Error("Invalid GLPI JSON response");
    }
  }
  async function search(
    type: string,
    field: string,
    value: string,
  ): Promise<Row[]> {
    const rows: Row[] = [];
    for (let start = 0; start < 10_000; start += 100) {
      const query = new URLSearchParams({
        [`searchText[${field}]`]: value,
        range: `${start}-${start + 99}`,
        get_hateoas: "false",
      });
      const response = await call(`${type}?${query}`);
      const page: unknown = await json(response);
      if (!Array.isArray(page)) throw new Error("Invalid GLPI search response");
      rows.push(...page);
      const total = Number(
        response.headers.get("Content-Range")?.split("/")[1],
      );
      if (
        (Number.isFinite(total) && start + page.length >= total) ||
        page.length < 100
      )
        return rows;
    }
    throw new Error("GLPI identity search limit exceeded");
  }
  try {
    const init = await json(await call("initSession"));
    if (!init || typeof init.session_token !== "string" || !init.session_token)
      throw new Error("Invalid GLPI session response");
    session = init.session_token;
    // GLPI searchText uses LIKE; filter exact values and check both identity keys.
    const users = (await search("User", "name", login)).filter(
      (row) => row.name?.toLowerCase() === login.toLowerCase(),
    );
    const emails = (await search("UserEmail", "email", email)).filter(
      (row) => row.email?.toLowerCase() === email,
    );
    if (users.length > 1 || new Set(emails.map((row) => row.users_id)).size > 1)
      throw new Error("GLPI identity is ambiguous");
    if (users.length) {
      const existing = users[0];
      if (!emails.length || emails.some((row) => row.users_id !== existing.id))
        throw new Error("GLPI identity mismatch");
      if ((enabled && !existing.is_active) || existing.is_deleted)
        throw new Error("GLPI account is locally inactive");
      return "COMPLETED" as const;
    }
    const matricule = user.sageEmployeeId ?? user.employeeId;
    if (emails.length) {
      if (attribute !== "email")
        throw new Error("GLPI email already belongs to another login");
      // The deployed SAML plugin also resolves an existing account by unique email.
      // Preserve legacy local logins and all their roles instead of duplicating them.
      const existing: Row = await json(
        await call(`User/${emails[0].users_id}`),
      );
      if (existing.id !== emails[0].users_id)
        throw new Error("GLPI identity mismatch");
      if (
        existing.registration_number &&
        matricule &&
        existing.registration_number !== matricule
      )
        throw new Error("GLPI identity mismatch");
      if ((enabled && !existing.is_active) || existing.is_deleted)
        throw new Error("GLPI account is locally inactive");
      return "COMPLETED" as const;
    }
    if (
      matricule &&
      (await search("User", "registration_number", matricule)).some(
        (row) => row.registration_number === matricule,
      )
    )
      throw new Error("GLPI matricule already belongs to another login");
    const [firstname, ...last] = user.displayName.trim().split(/\s+/);
    const created = await json(
      await call("User", {
        method: "POST",
        body: JSON.stringify({
          input: {
            name: login,
            ...(matricule ? { registration_number: matricule } : {}),
            firstname,
            realname: last.join(" "),
            is_active: enabled ? 1 : 0,
            authtype: 4, // Auth::EXTERNAL; SSO identity, no local password.
            _useremails: { "-1": email },
            _default_email: -1,
            // GLPI applies its own default profile/rules. No role is selected by the portal.
          },
        }),
      }),
    );
    if (!created || !Number.isInteger(created.id) || created.id <= 0)
      throw new Error("GLPI account creation not confirmed");
    return "COMPLETED" as const;
  } finally {
    if (session) await call("killSession").catch(() => undefined);
  }
}
