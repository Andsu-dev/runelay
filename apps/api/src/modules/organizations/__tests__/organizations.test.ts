import { beforeAll, expect, spyOn, test } from "bun:test";
import type { MeView, OrganizationView } from "@runelay/shared";
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
