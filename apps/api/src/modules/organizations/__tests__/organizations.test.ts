import { beforeAll, expect, spyOn, test } from "bun:test";
import type { MeView, OrganizationView } from "@runelay/shared";
import { db } from "@/db/connection";
import { auth } from "@/modules/auth/lib/better-auth";
import {
  createOrganization,
  describeMe,
  switchOrganization,
} from "@/modules/organizations/services/organization.service";
import { body, call, signUp, type TestAccount } from "../../../../test/helpers";

let account: TestAccount;

const uniqueSlug = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

beforeAll(async () => {
  account = await signUp("Organizações");
});

test("me describes the user and the active organization", async () => {
  const response = await call("/v1/me", { cookie: account.cookie });
  const { data } = await body<MeView>(response);
  expect(data.user.id).toBe(account.userId);
  expect(data.organization.id).toBe(account.organizationId);
  expect(data.organizations.map((organization) => organization.id)).toContain(account.organizationId);
});

test("lists the organizations of the user", async () => {
  const response = await call("/v1/organizations", { cookie: account.cookie });
  const { data } = await body<OrganizationView[]>(response);
  expect(data).toHaveLength(1);
  expect(data[0]?.role).toBe("owner");
});

test("creates an organization and switches to it", async () => {
  const slug = uniqueSlug("time");
  const created = await call("/v1/organizations", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "Time", slug },
  });
  expect(created.status).toBe(201);
  const organization = (await body<OrganizationView>(created)).data;
  expect(organization).toMatchObject({ name: "Time", slug, role: "owner" });
  const switched = await call("/v1/organizations/active", {
    method: "POST",
    cookie: account.cookie,
    json: { organizationId: organization.id },
  });
  expect(switched.status).toBe(200);
  expect((await body<MeView>(switched)).data.organization.id).toBe(organization.id);
  const me = await call("/v1/me", { cookie: account.cookie });
  expect((await body<MeView>(me)).data.organization.id).toBe(organization.id);
});

test("refuses a slug that is already in use", async () => {
  const slug = uniqueSlug("dup");
  await call("/v1/organizations", { method: "POST", cookie: account.cookie, json: { name: "A", slug } });
  const response = await call("/v1/organizations", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "B", slug },
  });
  expect(response.status).toBe(409);
  expect((await body(response)).error?.message).toContain(slug);
});

test("rejects invalid organization input", async () => {
  const response = await call("/v1/organizations", {
    method: "POST",
    cookie: account.cookie,
    json: { name: "Bad", slug: "Not A Slug" },
  });
  expect(response.status).toBe(400);
  expect((await body(response)).error?.code).toBe("INVALID_INPUT");
});

test("cannot switch to an organization the user is not a member of", async () => {
  const other = await signUp("Outra");
  const response = await call("/v1/organizations/active", {
    method: "POST",
    cookie: account.cookie,
    json: { organizationId: other.organizationId },
  });
  expect(response.status).toBe(403);
  expect((await body(response)).error?.code).toBe("FORBIDDEN");
});

test("describeMe forbids an organization outside the memberships", () => {
  const user = { id: account.userId, email: account.email, name: "Organizações", image: null };
  expect(describeMe(user, "missing").error?.code).toBe("FORBIDDEN");
});

test("createOrganization maps better-auth failures to STORAGE_FAILED", async () => {
  const headers = new Headers({ cookie: account.cookie });
  const input = { name: "X", slug: uniqueSlug("fail") };
  const rejected = spyOn(auth.api, "createOrganization").mockRejectedValueOnce(new Error("boom"));
  try {
    expect((await createOrganization(headers, account.userId, input)).error?.code).toBe("STORAGE_FAILED");
  } finally {
    rejected.mockRestore();
  }
  const empty = spyOn(auth.api, "createOrganization").mockResolvedValueOnce(null as never);
  try {
    expect((await createOrganization(headers, account.userId, input)).error?.code).toBe("STORAGE_FAILED");
  } finally {
    empty.mockRestore();
  }
  const ghost = spyOn(auth.api, "createOrganization").mockResolvedValueOnce({ id: "ghost" } as never);
  try {
    expect((await createOrganization(headers, account.userId, input)).error?.code).toBe("STORAGE_FAILED");
  } finally {
    ghost.mockRestore();
  }
});

test("switchOrganization maps better-auth failures to STORAGE_FAILED", async () => {
  const user = { id: account.userId, email: account.email, name: "Organizações", image: null };
  const spy = spyOn(auth.api, "setActiveOrganization").mockRejectedValueOnce(new Error("boom"));
  try {
    const result = await switchOrganization(new Headers(), user, account.organizationId);
    expect(result.error?.code).toBe("STORAGE_FAILED");
  } finally {
    spy.mockRestore();
  }
});

const createTeam = async (owner: TestAccount, name = "Time") => {
  const response = await call("/v1/organizations", {
    method: "POST",
    cookie: owner.cookie,
    json: { name, slug: uniqueSlug("team") },
  });
  return (await body<OrganizationView>(response)).data;
};

const LOGO = "data:image/png;base64,iVBORw0KGgo=";

test("renames an organization and sets its logo", async () => {
  const owner = await signUp("Editora");
  const team = await createTeam(owner);
  const renamed = await call(`/v1/organizations/${team.id}`, {
    method: "PATCH",
    cookie: owner.cookie,
    json: { name: "  Novo nome ", logo: LOGO },
  });
  expect(renamed.status).toBe(200);
  expect((await body<OrganizationView>(renamed)).data).toMatchObject({ id: team.id, name: "Novo nome", logo: LOGO });
  const cleared = await call(`/v1/organizations/${team.id}`, {
    method: "PATCH",
    cookie: owner.cookie,
    json: { logo: null },
  });
  expect((await body<OrganizationView>(cleared)).data).toMatchObject({ name: "Novo nome", logo: null });
  const listed = await body<OrganizationView[]>(await call("/v1/organizations", { cookie: owner.cookie }));
  expect(listed.data.find((organization) => organization.id === team.id)).toMatchObject({
    name: "Novo nome",
    logo: null,
  });
});

test("rejects an invalid organization update", async () => {
  const owner = await signUp("Inválida");
  for (const json of [{ name: " " }, { logo: "http://example.com/logo.png" }]) {
    const response = await call(`/v1/organizations/${owner.organizationId}`, {
      method: "PATCH",
      cookie: owner.cookie,
      json,
    });
    expect(response.status).toBe(400);
  }
});

test("only owners and admins update, only owners delete", async () => {
  const owner = await signUp("Dona");
  const guest = await signUp("Convidada");
  const team = await createTeam(owner);
  const outsider = await call(`/v1/organizations/${team.id}`, {
    method: "PATCH",
    cookie: guest.cookie,
    json: { name: "Invadida" },
  });
  expect(outsider.status).toBe(403);
  const join = (role: string) =>
    db
      .query("INSERT INTO member (id, organizationId, userId, role, createdAt) VALUES (?, ?, ?, ?, ?)")
      .run(crypto.randomUUID(), team.id, guest.userId, role, new Date().toISOString());
  join("member");
  const member = await call(`/v1/organizations/${team.id}`, {
    method: "PATCH",
    cookie: guest.cookie,
    json: { name: "Invadida" },
  });
  expect(member.status).toBe(403);
  db.query("UPDATE member SET role = 'admin' WHERE organizationId = ? AND userId = ?").run(team.id, guest.userId);
  const admin = await call(`/v1/organizations/${team.id}`, {
    method: "PATCH",
    cookie: guest.cookie,
    json: { name: "Da admin" },
  });
  expect(admin.status).toBe(200);
  const removal = await call(`/v1/organizations/${team.id}`, { method: "DELETE", cookie: guest.cookie });
  expect(removal.status).toBe(403);
});

test("deletes an organization with its data and moves the session", async () => {
  const owner = await signUp("Apagadora");
  const team = await createTeam(owner);
  await call("/v1/organizations/active", {
    method: "POST",
    cookie: owner.cookie,
    json: { organizationId: team.id },
  });
  const source = await call("/v1/sources", {
    method: "POST",
    cookie: owner.cookie,
    json: { name: "docs", config: { kind: "mcp", url: "https://example.com/mcp", headers: {} }, enabled: false },
  });
  expect(source.status).toBe(201);
  await call("/v1/api-keys", { method: "POST", cookie: owner.cookie, json: { name: "agente" } });
  const removed = await call(`/v1/organizations/${team.id}`, { method: "DELETE", cookie: owner.cookie });
  expect(removed.status).toBe(200);
  const me = (await body<MeView>(removed)).data;
  expect(me.organization.id).toBe(owner.organizationId);
  expect(me.organizations.map((organization) => organization.id)).toEqual([owner.organizationId]);
  const count = (sql: string) => db.query<{ total: number }, [string]>(sql).get(team.id)?.total;
  expect(count("SELECT COUNT(*) AS total FROM sources WHERE organization_id = ?")).toBe(0);
  expect(count("SELECT COUNT(*) AS total FROM apikey WHERE referenceId = ?")).toBe(0);
  expect(count("SELECT COUNT(*) AS total FROM member WHERE organizationId = ?")).toBe(0);
  expect(count("SELECT COUNT(*) AS total FROM organization WHERE id = ?")).toBe(0);
  const after = await call("/v1/me", { cookie: owner.cookie });
  expect((await body<MeView>(after)).data.organization.id).toBe(owner.organizationId);
});

test("refuses to delete the only organization of a member", async () => {
  const owner = await signUp("Única");
  const response = await call(`/v1/organizations/${owner.organizationId}`, {
    method: "DELETE",
    cookie: owner.cookie,
  });
  expect(response.status).toBe(409);
  expect((await body(response)).error?.code).toBe("LAST_ORGANIZATION");
});
