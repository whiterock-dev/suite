export function hrefForUrl(url: string): string {
  const t = url.trim();
  if (!t) return "#";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function hostLabel(url: string): string {
  const t = url.trim();
  if (!t) return "—";
  try {
    return new URL(hrefForUrl(t)).host;
  } catch {
    return t;
  }
}
