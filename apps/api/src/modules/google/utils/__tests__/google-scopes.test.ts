import { expect, test } from "bun:test";
import { googleServiceSchema } from "@runelay/shared";
import {
  GOOGLE_BASE_SCOPES,
  GOOGLE_REGISTERED_SCOPES,
  GOOGLE_SERVICE_SCOPES,
  GOOGLE_SERVICES,
} from "@/modules/google/constants/google.constants";
import { grantedServices, missingScopes, scopesFor, splitScopes } from "@/modules/google/utils/google-scopes";

const auth = (name: string) => `https://www.googleapis.com/auth/${name}`;

test("the union of every service is exactly the registered scope list", () => {
  expect(scopesFor(GOOGLE_SERVICES).sort()).toEqual([...GOOGLE_REGISTERED_SCOPES].sort());
  expect(new Set(GOOGLE_REGISTERED_SCOPES).size).toBe(12);
  expect(GOOGLE_SERVICES).toEqual(googleServiceSchema.options);
});

test("each service maps to its registered scopes", () => {
  expect(GOOGLE_BASE_SCOPES).toEqual(["openid", auth("userinfo.email"), auth("userinfo.profile")]);
  expect(GOOGLE_SERVICE_SCOPES).toEqual({
    calendar: [auth("calendar"), auth("calendar.events")],
    docs: [auth("documents"), auth("drive.file")],
    sheets: [auth("spreadsheets"), auth("drive.file")],
    slides: [auth("presentations"), auth("drive.file")],
    drive: [auth("drive.file")],
    gmail: [auth("gmail.send")],
    forms: [auth("forms.body"), auth("drive.file")],
    meet: [auth("meetings.space.created")],
  });
  for (const service of GOOGLE_SERVICES) {
    expect(scopesFor([service])).toEqual([...GOOGLE_BASE_SCOPES, ...GOOGLE_SERVICE_SCOPES[service]]);
  }
});

test("never asks for scopes outside the registered list", () => {
  const all = scopesFor(GOOGLE_SERVICES);
  for (const forbidden of [
    "gmail.readonly",
    "gmail.modify",
    "gmail.compose",
    "drive",
    "calendar.calendarlist.readonly",
  ]) {
    expect(all).not.toContain(auth(forbidden));
  }
});

test("shared scopes are requested once", () => {
  expect(scopesFor(["docs", "sheets", "drive"]).filter((scope) => scope === auth("drive.file"))).toHaveLength(1);
});

test("missing scopes and granted services follow what Google granted", () => {
  const granted = [...GOOGLE_BASE_SCOPES, auth("gmail.send"), auth("documents")];
  expect(missingScopes(["gmail"], granted)).toEqual([]);
  expect(missingScopes(["gmail", "docs"], granted)).toEqual([auth("drive.file")]);
  expect(grantedServices(granted)).toEqual(["gmail"]);
  expect(grantedServices([auth("gmail.send")])).toEqual([]);
  expect(grantedServices(scopesFor(GOOGLE_SERVICES))).toEqual(GOOGLE_SERVICES);
});

test("splits a token scope string", () => {
  expect(splitScopes(" openid  email ")).toEqual(["openid", "email"]);
  expect(splitScopes(undefined)).toEqual([]);
});
