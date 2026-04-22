import { writeFileSync } from "node:fs";
import path from "node:path";
import { env } from "node:process";

const TREE = "mermaid@11.14.0";
const REPO = "mermaid-js/mermaid";
const REPO_API = `https://api.github.com/repos/${REPO}`;
const REPO_RAW = `https://raw.githubusercontent.com/${REPO}/${TREE}`;
const DOCS_PATH = "packages/mermaid/src/docs";
const SKILL_PATH = "./skills/mermaid";

const getRawContent = async (path: string) => {
  const res = await fetch(`${REPO_RAW}/${path}`);
  return await res.text();
};

const req = await fetch(`${REPO_API}/git/trees/${TREE}?recursive=1`, {
  headers: !env.GITHUB_TOKEN
    ? undefined
    : {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      },
});
const res = (await req.json()) as {
  tree: {
    path: string;
  }[];
};

const syntaxItems = res.tree.filter(
  (item) =>
    item.path.startsWith(`${DOCS_PATH}/syntax`) && item.path.endsWith(".md"),
);

const references: string[] = [];

await Promise.all(
  syntaxItems.map(async (item) => {
    const rawName = item.path.replace(`${DOCS_PATH}/`, "");

    references.push(
      `- [${rawName.replace("syntax/", "").replace(".md", "")}](./${rawName})`,
    );

    const content = await getRawContent(item.path);

    writeFileSync(path.join(SKILL_PATH, rawName), content);
  }),
);

writeFileSync(
  path.join(SKILL_PATH, "syntax-references.md"),
  [`# Syntax References`, "", ...references.flat()].join("\n"),
);
