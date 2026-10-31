export function isRecoveryHash(hash: string): boolean {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && !params.has("error") && !params.has("error_code");
}