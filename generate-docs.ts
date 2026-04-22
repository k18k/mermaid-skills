import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { env } from "node:process";

const TREE = "mermaid@11.14.0";
const REPO = "mermaid-js/mermaid";
const REPO_API = `https://api.github.com/repos/${REPO}`;
const REPO_RAW = `https://raw.githubusercontent.com/${REPO}/${TREE}`;
const DOCS_PATH = "packages/mermaid/src/docs";
const SKILL_PATH = "./skills/mermaid";

const getRawContent = async (filePath: string) => {
  const res = await fetch(`${REPO_RAW}/${filePath}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch raw file ${filePath}: ${res.status} ${res.statusText}`);
  }
  return await res.text();
};

const req = await fetch(`${REPO_API}/git/trees/${TREE}?recursive=1`, {
  headers: !env.GITHUB_TOKEN
    ? undefined
    : { Authorization: `Bearer ${env.GITHUB_TOKEN}` },
});

if (!req.ok) {
  throw new Error(`Failed to fetch repo tree: ${req.status} ${req.statusText}`);
}

const res = (await req.json()) as {
  tree: { path: string; type?: string }[];
};

const syntaxItems = res.tree
  .filter((item) => item.path.startsWith(`${DOCS_PATH}/syntax`) && item.path.endsWith(".md"))
  .sort((a, b) => a.path.localeCompare(b.path));

const results = await Promise.all(
  syntaxItems.map(async (item) => {
    const rawName = item.path.replace(`${DOCS_PATH}/`, "");
    const content = await getRawContent(item.path);
    return {
      rawName,
      content,
      reference: `- [${rawName.replace("syntax/", "").replace(".md", "")}](./${rawName})`,
    };
  }),
);

for (const result of results) {
  const outPath = path.join(SKILL_PATH, result.rawName);
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, result.content);
}

writeFileSync(
  path.join(SKILL_PATH, "syntax-references.md"),
  ["# Syntax References", "", ...results.map((r) => r.reference)].join("\n"),
);