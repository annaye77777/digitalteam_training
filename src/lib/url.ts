export function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}
