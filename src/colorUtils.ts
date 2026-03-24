const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export function isValidHexColor(s: string): boolean {
  return HEX.test(s.trim());
}

/** Normalize #rgb → #rrggbb for storage; returns undefined if invalid. */
export function parseCardColor(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const s = raw.trim();
  if (!isValidHexColor(s)) return undefined;
  if (s.length === 4) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return s.length === 7 || s.length === 9 ? s.toLowerCase() : s.toLowerCase();
}

export const FALLBACK_COLOR_PICKER = "#64748b";
