export const CURRENCY = "Rs.";

export function money(value: number, opts?: { compact?: boolean; decimals?: boolean }) {
  if (opts?.compact) {
    if (Math.abs(value) >= 1_000_000) return `${CURRENCY} ${(value / 1_000_000).toFixed(2)}M`;
    if (Math.abs(value) >= 1_000) return `${CURRENCY} ${(value / 1_000).toFixed(1)}K`;
    return `${CURRENCY} ${value.toFixed(0)}`;
  }
  const decimals = opts?.decimals ?? false;
  return `${CURRENCY} ${value.toLocaleString("en-LK", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;
}

export function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
