import { expect, spyOn, test } from "bun:test";
import { auth } from "@/modules/auth/lib/better-auth";
import { body, call } from "../../test/helpers";

test("static files are served from the web dist", async () => {
  const response = await call("/index.html");
  expect(response.status).toBe(200);
  expect(await response.text()).toContain("<title>runelay</title>");
});

test("non GET requests outside the api return NOT_FOUND", async () => {
  const response = await call("/some/page", { method: "POST" });
  expect(response.status).toBe(404);
  expect((await body(response)).error?.code).toBe("NOT_FOUND");
});

test("unexpected errors become INTERNAL with the error message", async () => {
  const spy = spyOn(auth, "handler").mockRejectedValueOnce(new Error("kaboom"));
  try {
    const response = await call("/v1/auth/get-session");
    expect(response.status).toBe(500);
    const { error } = await body(response);
    expect(error).toMatchObject({ code: "INTERNAL", message: "kaboom" });
  } finally {
    spy.mockRestore();
  }
});
