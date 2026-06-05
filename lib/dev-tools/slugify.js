export function slugifyName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function diagnoseSlug(raw) {
  if (raw === "") return null;
  if (SLUG_PATTERN.test(raw)) return null;

  const issues = [];
  if (/[A-Z]/.test(raw)) issues.push("含大寫字母");
  if (/_/.test(raw)) issues.push("含底線(slug 內只能用連字號 -)");
  if (/\s/.test(raw)) issues.push("含空白");
  if (/--/.test(raw)) issues.push("含連續連字號");
  if (/^-/.test(raw)) issues.push("開頭是連字號");
  if (/-$/.test(raw)) issues.push("結尾是連字號");

  const others = raw.match(/[^A-Za-z0-9_\s-]/g);
  if (others) {
    const uniq = Array.from(new Set(others)).join(" ");
    issues.push(`含不支援的字元:${uniq}`);
  }

  if (issues.length === 0) issues.push("格式不符 kebab-case");

  return {
    issues,
    suggestion: slugifyName(raw),
  };
}
