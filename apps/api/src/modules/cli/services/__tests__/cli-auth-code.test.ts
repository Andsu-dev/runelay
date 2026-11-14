import { expect, test } from "bun:test";
import { approveCliAuthSchema } from "@runeley/shared";
import { CLI_AUTH_CODE_ALPHABET } from "../../constants/cli-auth.constants";
import { generateCliAuthCode } from "../cli-auth.service";

test("codes use the unambiguous alphabet in the XXXX-XXXX shape the approve schema accepts", () => {
  for (let index = 0; index < 200; index += 1) {
    const code = generateCliAuthCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect([...code.replace("-", "")].every((character) => CLI_AUTH_CODE_ALPHABET.includes(character))).toBe(true);
    expect(approveCliAuthSchema.safeParse({ code: code.toLowerCase() }).success).toBe(true);
  }
});
