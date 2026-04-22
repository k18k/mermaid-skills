# mermaid-skills

Agent-ready Mermaid skill package for `npx skills add`.

## Install

```bash
npx skills add k18k/mermaid-skills --skill mermaid
````

## What this repo contains

* `skills/mermaid/SKILL.md` — main Mermaid skill
* `skills/mermaid/syntax/*.md` — generated syntax references sourced from Mermaid docs
* `generate-docs.ts` — fetches Mermaid docs from the upstream repo and writes local reference files

## Regenerate docs

```bash
npm start
```

## Source and attribution

This project includes content derived from:
[https://github.com/mermaid-js/mermaid](https://github.com/mermaid-js/mermaid)

Copyright (c) 2014–2022 Knut Sveidqvist
Licensed under the MIT License.