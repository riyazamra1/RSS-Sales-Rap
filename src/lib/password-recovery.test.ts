import { describe, test } from "node:test";
import { strict as assert } from "node:assert";
import { isRecoveryHash } from "./password-recovery";

describe("password recovery links", () => {
  test("accepts password recovery links", () => {
    assert.equal(isRecoveryHash("#type=recovery&access_token=test"), true);
  });
  test("does not accept ordinary sign-in links", () => {
    assert.equal(isRecoveryHash("#type=signup&access_token=test"), false);
    assert.equal(isRecoveryHash(""), false);
  });
  test("does not accept expired recovery links", () => {
    assert.equal(isRecoveryHash("#type=recovery&error_code=otp_expired"), false);
  });
});