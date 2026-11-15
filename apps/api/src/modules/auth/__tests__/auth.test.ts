import { afterEach, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { type MeView, PROFILE_IMAGE_MAX_LENGTH } from "@runelay/shared";
import { env } from "@/config/env";
import { db } from "@/db/connection";
import {
  PROFILE_INVALID_MESSAGE,
  SETUP_TOKEN_REQUIRED_MESSAGE,
  SIGNUP_CLOSED_MESSAGE,
} from "@/modules/auth/constants/auth.constants";
import { auth } from "@/modules/auth/lib/better-auth";
import { isSetupToken, SETUP_TOKEN, setupUrl } from "@/modules/auth/lib/setup-token";
import {
  ensurePersonalOrganization,
  findMembership,
  findMembershipRole,
  slugTaken,
} from "@/modules/auth/repositories/membership.repository";
import { activeOrganizationOf, hasBearer, principalFromApiKey, sessionOf } from "@/modules/auth/services/auth.service";
import { slugify } from "@/modules/auth/utils/slugify";
import {
  setActiveOrganization,
  signIn,
  signUpRequest,
  signUpWithToken,
  uniqueEmail,
} from "../../../../test/auth-helpers";
import { body, call, createApiKey, resetDatabase, signUp, type TestAccount } from "../../../../test/helpers";

const originalAllowSignup = env.ALLOW_SIGNUP;
const originalRateLimit = env.RUNELAY_RATE_LIMIT_PER_MINUTE;

afterEach(() => {
  env.ALLOW_SIGNUP = originalAllowSignup;
  env.RUNELAY_RATE_LIMIT_PER_MINUTE = originalRateLimit;
});

describe("first access", () => {
  beforeAll(() => {
    resetDatabase();
  });

  test("setup reports that the instance needs a first account", async () => {
    const response = await call("/v1/setup");
    expect((await body<{ needsSetup: boolean }>(response)).data.needsSetup).toBe(true);
  });

  test("first sign up without the setup token is forbidden", async () => {
    const response = await signUpRequest(uniqueEmail("first"));
    expect(response.status).toBe(403);
    expect(await response.text()).toContain(SETUP_TOKEN_REQUIRED_MESSAGE);
  });

  test("first sign up with a wrong setup token is forbidden", async () => {
    const response = await signUpWithToken(uniqueEmail("first"), "wrong-token-value");
    expect(response.status).toBe(403);
  });

  test("first sign up with the setup token succeeds and closes setup", async () => {
    const response = await signUpWithToken(uniqueEmail("first"), SETUP_TOKEN);
    expect(response.status).toBe(200);
    const setup = await call("/v1/setup");
    expect((await body<{ needsSetup: boolean }>(setup)).data.needsSetup).toBe(false);
  });

  test("later sign ups do not need the setup token while signup is open", async () => {
    const response = await signUpRequest(uniqueEmail("later"));
    expect(response.status).toBe(200);
  });

  test("sign up is refused when signup is closed", async () => {
    env.ALLOW_SIGNUP = false;
    const response = await signUpRequest(uniqueEmail("closed"));
    expect(response.status).toBe(403);
    expect(await response.text()).toContain(SIGNUP_CLOSED_MESSAGE);
  });
});

describe("sessions", () => {
  test("sign in sets the personal organization as active", async () => {
    const account = await signUp("Sessão Ativa");
    const response = await signIn(account.email);
    expect(response.status).toBe(200);
    const session = db
      .query<{ activeOrganizationId: string }, [string]>(
        "SELECT activeOrganizationId FROM session WHERE userId = ? ORDER BY createdAt DESC LIMIT 1",
      )
      .get(account.userId);
    expect(session?.activeOrganizationId).toBe(account.organizationId);
  });

  test("sign in recreates a missing personal organization", async () => {
    const account = await signUp("Sem Organização");
    db.query("DELETE FROM member WHERE userId = ?").run(account.userId);
    const response = await signIn(account.email);
    expect(response.status).toBe(200);
    expect(findMembership(account.userId, account.organizationId).data).toBeNull();
    const role = db.query<{ role: string }, [string]>("SELECT role FROM member WHERE userId = ?").get(account.userId);
    expect(role?.role).toBe("owner");
  });

  test("sign in fails when the personal organization cannot be stored", async () => {
    const account = await signUp("Falha");
    db.query("DELETE FROM member WHERE userId = ?").run(account.userId);
    db.run(
      "CREATE TEMP TRIGGER block_organization BEFORE INSERT ON organization BEGIN SELECT RAISE(ABORT, 'blocked'); END",
    );
    try {
      const response = await signIn(account.email);
      expect(response.status).toBe(500);
    } finally {
      db.run("DROP TRIGGER IF EXISTS temp.block_organization");
    }
  });
});

describe("middlewares", () => {
  let account: TestAccount;
  let key: string;

  beforeAll(async () => {
    account = await signUp("Middleware");
    key = (await createApiKey(account, "middleware")).key;
  });

  test("requireAccount rejects anonymous and bearer requests", async () => {
    const anonymous = await call("/v1/organizations");
    expect(anonymous.status).toBe(401);
    expect((await body(anonymous)).error?.code).toBe("SESSION_REQUIRED");
    const bearer = await call("/v1/organizations", { bearer: key });
    expect((await body(bearer)).error?.code).toBe("SESSION_REQUIRED");
  });

  test("requireSession rejects anonymous and bearer requests", async () => {
    expect((await body(await call("/v1/me"))).error?.code).toBe("SESSION_REQUIRED");
    expect((await body(await call("/v1/me", { bearer: key }))).error?.code).toBe("SESSION_REQUIRED");
  });

  test("requireSession and requireOrganization need an active organization", async () => {
    const other = await signUp("Sem Ativa");
    setActiveOrganization(other.userId, null);
    const me = await call("/v1/me", { cookie: other.cookie });
    expect(me.status).toBe(403);
    expect((await body(me)).error?.code).toBe("ORGANIZATION_REQUIRED");
    const memories = await call("/v1/memories", { cookie: other.cookie });
    expect((await body(memories)).error?.code).toBe("ORGANIZATION_REQUIRED");
  });

  test("an active organization the user does not belong to is forbidden", async () => {
    const other = await signUp("Intruso");
    setActiveOrganization(other.userId, account.organizationId);
    expect((await body(await call("/v1/me", { cookie: other.cookie }))).error?.code).toBe("FORBIDDEN");
    expect((await body(await call("/v1/memories", { cookie: other.cookie }))).error?.code).toBe("FORBIDDEN");
  });

  test("requireOrganization accepts a session cookie", async () => {
    const response = await call("/v1/memories", { cookie: account.cookie });
    expect(response.status).toBe(200);
  });

  test("requireOrganization rejects anonymous and invalid keys", async () => {
    const anonymous = await call("/v1/memories");
    expect(anonymous.status).toBe(401);
    expect((await body(anonymous)).error?.code).toBe("UNAUTHORIZED");
    const invalid = await call("/v1/memories", { bearer: "rnl_invalid" });
    expect((await body(invalid)).error?.code).toBe("UNAUTHORIZED");
  });

  test("api key calls are recorded in the audit log with the client ip", async () => {
    const created = await createApiKey(account, "audited");
    const response = await call("/v1/memories?limit=5", {
      bearer: created.key,
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(response.status).toBe(200);
    const row = db
      .query<{ method: string; path: string; status: number; ip: string }, [string]>(
        "SELECT method, path, status, ip FROM audit_events WHERE api_key_id = ?",
      )
      .get(created.id);
    expect(row).toEqual({ method: "GET", path: "/v1/memories", status: 200, ip: "203.0.113.9" });
  });

  test("api key calls over the limit get 429 with retry-after", async () => {
    const created = await createApiKey(account, "limited");
    env.RUNELAY_RATE_LIMIT_PER_MINUTE = 1;
    expect((await call("/v1/memories", { bearer: created.key })).status).toBe(200);
    const blocked = await call("/v1/memories", { bearer: created.key });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect((await body(blocked)).error?.code).toBe("RATE_LIMITED");
  });
});

describe("profile update", () => {
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
  const updateUser = (account: TestAccount, json: unknown) =>
    call("/v1/auth/update-user", { method: "POST", cookie: account.cookie, json });
  const meOf = async (account: TestAccount) =>
    (await body<MeView>(await call("/v1/me", { cookie: account.cookie }))).data;

  test("me starts without a photo", async () => {
    const account = await signUp("Sem Foto");
    expect((await meOf(account)).user.image).toBeNull();
  });

  test("updates the name and photo and exposes them on me", async () => {
    const account = await signUp("Perfil");
    const response = await updateUser(account, { name: "  Novo Nome  ", image: photo });
    expect(response.status).toBe(200);
    const { user } = await meOf(account);
    expect(user.name).toBe("Novo Nome");
    expect(user.image).toBe(photo);
  });

  test("removes the photo with null", async () => {
    const account = await signUp("Remover Foto");
    await updateUser(account, { image: photo });
    expect((await updateUser(account, { image: null })).status).toBe(200);
    expect((await meOf(account)).user.image).toBeNull();
  });

  test("rejects a photo over the size cap", async () => {
    const account = await signUp("Foto Grande");
    const oversized = `data:image/jpeg;base64,${"A".repeat(PROFILE_IMAGE_MAX_LENGTH)}`;
    const response = await updateUser(account, { image: oversized });
    expect(response.status).toBe(400);
    expect(await response.text()).toContain(PROFILE_INVALID_MESSAGE);
    expect((await meOf(account)).user.image).toBeNull();
  });

  test("rejects a photo that is not an image data url and an empty name", async () => {
    const account = await signUp("Inválido");
    expect((await updateUser(account, { image: "data:text/html;base64,PGgxPg==" })).status).toBe(400);
    expect((await updateUser(account, { image: "javascript:alert(1)" })).status).toBe(400);
    expect((await updateUser(account, { name: "   " })).status).toBe(400);
    expect((await meOf(account)).user.name).toBe("Inválido");
  });

  test("requires a session", async () => {
    expect((await call("/v1/auth/update-user", { method: "POST", json: { name: "Anônimo" } })).status).toBe(401);
  });
});

describe("auth service", () => {
  test("hasBearer reads the authorization header", () => {
    expect(hasBearer(new Headers({ authorization: "Bearer abc" }))).toBe(true);
    expect(hasBearer(new Headers({ authorization: "Basic abc" }))).toBe(false);
    expect(hasBearer(new Headers())).toBe(false);
  });

  test("principalFromApiKey returns null without a key or when verification throws", async () => {
    expect(await principalFromApiKey(new Headers())).toBeNull();
    const spy = spyOn(auth.api, "verifyApiKey").mockRejectedValueOnce(new Error("boom"));
    try {
      expect(await principalFromApiKey(new Headers({ authorization: "Bearer rnl_x" }))).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  test("sessionOf returns null when the session lookup throws", async () => {
    const spy = spyOn(auth.api, "getSession").mockRejectedValueOnce(new Error("boom"));
    try {
      expect(await sessionOf(new Headers())).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  test("activeOrganizationOf requires an organization and a membership", async () => {
    const account = await signUp("Ativo");
    expect(activeOrganizationOf(account.userId, null).error?.code).toBe("ORGANIZATION_REQUIRED");
    expect(activeOrganizationOf(account.userId, "missing").error?.code).toBe("FORBIDDEN");
    expect(activeOrganizationOf(account.userId, account.organizationId).data).toBe(account.organizationId);
  });
});

describe("membership repository", () => {
  test("reads roles, slugs and memberships", async () => {
    const account = await signUp("Repositório");
    expect(findMembershipRole(account.userId, account.organizationId).data).toBe("owner");
    expect(findMembershipRole(account.userId, "missing").data).toBeNull();
    const slug = db
      .query<{ slug: string }, [string]>("SELECT slug FROM organization WHERE id = ?")
      .get(account.organizationId)?.slug;
    expect(slugTaken(slug ?? "").data).toBe(true);
    expect(slugTaken(`free-${crypto.randomUUID()}`).data).toBe(false);
    expect(findMembership(account.userId, account.organizationId).data?.role).toBe("owner");
  });

  test("ensurePersonalOrganization returns the existing one, null for unknown users and suffixes taken slugs", async () => {
    const first = await signUp("Mesmo Nome");
    const second = await signUp("Mesmo Nome");
    expect(ensurePersonalOrganization(first.userId).data).toBe(first.organizationId);
    expect(ensurePersonalOrganization("missing-user").data).toBeNull();
    const slugs = db
      .query<{ slug: string }, [string, string]>("SELECT slug FROM organization WHERE id IN (?, ?) ORDER BY slug")
      .all(first.organizationId, second.organizationId)
      .map((row) => row.slug);
    expect(slugs.some((slug) => slug.startsWith("mesmo-nome-"))).toBe(true);
  });

  test("storage failures surface as STORAGE_FAILED", () => {
    const spy = spyOn(db, "query").mockImplementation(() => {
      throw new Error("disk");
    });
    try {
      expect(findMembershipRole("u", "o").error?.code).toBe("STORAGE_FAILED");
      expect(slugTaken("x").error?.code).toBe("STORAGE_FAILED");
      expect(findMembership("u", "o").error?.code).toBe("STORAGE_FAILED");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("setup token and slugify", () => {
  test("isSetupToken compares safely", () => {
    expect(isSetupToken(SETUP_TOKEN)).toBe(true);
    expect(isSetupToken(null)).toBe(false);
    expect(isSetupToken(undefined)).toBe(false);
    expect(isSetupToken("short")).toBe(false);
  });

  test("setupUrl points at the signup page with the token", () => {
    expect(setupUrl()).toBe(`${env.PUBLIC_URL}/login?mode=signup&token=${SETUP_TOKEN}`);
  });

  test("slugify strips accents and falls back for empty names", () => {
    expect(slugify("  Ação Única! ")).toBe("acao-unica");
    expect(slugify("!!!")).toBe("pessoal");
    expect(slugify("a".repeat(60))).toHaveLength(40);
  });
});
