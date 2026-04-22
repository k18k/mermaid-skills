import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env } from "node:process";
import { findPackageJSON } from "node:module";

const REPO = "mermaid-js/mermaid";
const REPO_API = `https://api.github.com/repos/${REPO}`;
const DOCS_PATH = "packages/mermaid/src/docs";
const SKILL_PATH = "./skills/mermaid";

const headers = env.GITHUB_TOKEN
  ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` }
  : undefined;

/* ---------------- utils ---------------- */

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.json();
};

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Fetch failed: ${url} (${res.status})`);
  return res.text();
};

const getPkg = () => {
  const pkgPath = findPackageJSON(import.meta.url);
  if (!pkgPath) throw new Error("package.json not found");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  return { pkg, pkgPath };
};

/* ---------------- version ---------------- */

const { pkg, pkgPath } = getPkg();

const { tag_name } = await fetchJson<{ tag_name: string }>(
  `${REPO_API}/releases/latest`
);

// GitHub: v11.14.0 → version: 11.14.0
const version = tag_name.startsWith("v") ? tag_name.slice(1) : tag_name;

// raw/git tree uses tag directly
const ref = tag_name;

if (pkg.version === version) {
  console.log("Up to date:", version);
  process.exit(0);
}

console.log("Updating →", version);

/* ---------------- fetch tree ---------------- */

const { tree } = await fetchJson<{
  tree: { path: string; type?: string }[];
}>(`${REPO_API}/git/trees/${ref}?recursive=1`);

const syntaxItems = tree
  .filter(
    (i) =>
      i.type === "blob" &&
      i.path.startsWith(`${DOCS_PATH}/syntax`) &&
      i.path.endsWith(".md")
  )
  .sort((a, b) => a.path.localeCompare(b.path));

/* ---------------- fetch files ---------------- */

const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${ref}`;

const results = await Promise.all(
  syntaxItems.map(async (item) => {
    const rawName = item.path.replace(`${DOCS_PATH}/`, "");
    const content = await fetchText(`${RAW_BASE}/${item.path}`);

    return {
      rawName,
      content,
      reference: `- [${rawName.replace("syntax/", "").replace(".md", "")}](./${rawName})`,
    };
  })
);

/* ---------------- write files ---------------- */

for (const r of results) {
  const out = path.join(SKILL_PATH, r.rawName);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, r.content);
}

writeFileSync(
  path.join(SKILL_PATH, "syntax-references.md"),
  ["# Syntax References", "", ...results.map((r) => r.reference)].join("\n")
);

/* ---------------- update package.json ---------------- */

pkg.version = version;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

console.log("Done.");