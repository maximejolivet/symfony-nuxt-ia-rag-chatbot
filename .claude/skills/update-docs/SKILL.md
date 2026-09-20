---
name: update-docs
description: "Update the repo's Markdown documentation (README.md, SECURITY.md, backend/README.md, frontend/README.md, docs/**/*.md) so it matches the actual current code: version badges, stack tables, commands, architecture, admin pages, the docs/README.md index and page-count badge. Use whenever the user asks to update, refresh, sync or audit the .md docs/documentation, after a change that makes docs stale (dependency bump, new page/route/command, migration to another tool), or before a release."
---

Keep the Markdown docs **truthful against the code as it is now**, never against what a task intended. Docs are written in French (dense, technical, no filler); commit messages are in English (see the `semantic-commit-messages` skill).

For the Bruno collection (`docs/backend/bruno/**/*.bru`) and API-surface sync after a backend task, use the `docs-bruno-sync` agent instead — it owns `.bru` files. This skill covers the `.md` files only.

## Map: which doc answers to which code

| Doc | Depends on |
|---|---|
| `README.md` (root) | Badges (PHP, Symfony, API Platform, Node, Nuxt, Vue, TypeScript, MariaDB…) ← `backend/composer.json`, `frontend/package.json`, `docker-compose*.yml`, `.github/workflows/` |
| `backend/README.md` | Stack, install, layout ← `backend/composer.json`, `backend/src/`, `backend/config/`, `Makefile` |
| `frontend/README.md` | Stack, scripts, structure ← `frontend/package.json`, `frontend/nuxt.config.ts`, `frontend/{components,composables,pages,server}/` |
| `docs/ONBOARDING.md` | Stack versions, architecture tree, `make` commands, conventions ← nearly everything; the most drift-prone file |
| `docs/DEPLOYMENT.md` | `.github/workflows/`, hosting config (o2switch, Vercel), env vars |
| `docs/backend/SPECIFICATION.md` | Domains, entities, API resources, security, rate limits ← `backend/src/`, `backend/config/packages/` |
| `docs/backend/ADMIN.md` | Admin pages ← `backend/src/Controller/Admin/`, `backend/src/Grid/`, `backend/templates/admin/`, admin menu |
| `docs/frontend/SPECIFICATION.md` | Chat widget behavior, proxy allowlist ← `frontend/{components,composables,pages,server}/` |
| `SECURITY.md` | Voters, `security.yaml`, CSRF, rate limiters |
| `docs/BACKLOG.md` | `- [ ]` / `- [x]` items with verification notes |
| `docs/README.md` | Index of every Markdown file + page-count badge |

Out of scope, never edit: `backend/AGENTS.md` (generated skills table), `.claude/**` (skill/agent definitions — unless the user asks), `backend/var/**` (uploaded documents).

## Workflow

1. **Scope.** If the user named a doc or a topic, start there. Otherwise start from the change:
   ```bash
   git status --short && git diff HEAD --stat && git log --oneline -10
   ```
   Map the touched paths to docs with the table above. For a full audit, go through every row.
2. **Read the doc, then the code it claims to describe.** Check each concrete claim — version numbers, file paths, command names, route names, env vars, counts — against the source (`composer.json`, `package.json`, `Makefile`, `git ls-files`, `grep`). Don't trust the doc, and don't trust the diff alone.
3. **Fix only what is wrong or missing.** Edit the specific stale line/section/row in place; append a new section only when the code gained something that has no home yet. No rewrites for style, no busywork.
4. **Propagate.** A fact usually lives in several docs (a Nuxt version shows up in the root badges, `frontend/README.md` and the `ONBOARDING.md` stack table). `grep -rn` the old value across all `.md` files before declaring it done.
5. **Fix the index.** If a page was added/removed, update `docs/README.md`: the bullet **and** the badge `![docs](https://img.shields.io/badge/docs-N%20pages-informational)` (N = pages listed).
6. **Verify links and paths.** Every relative link and every `path/in/backticks` you touched or wrote must exist:
   ```bash
   git ls-files | grep -F '<path>'
   ```

## Writing conventions

- French, present tense, dense. Tables where the file already uses tables; prose with inline code elsewhere.
- Cross-reference with relative Markdown links to the real file (`[backend/src/...](../../backend/src/...)`), not bare file names.
- Keep the file's existing structure, heading levels and badge style. Badge versions match what `composer.json`/`package.json` actually resolve to (major.minor, as the existing badges do).
- Dated notes use today's real date, never a placeholder.
- If something can't be verified (needs a real LLM provider, a browser, prod), say so in the doc with the repo's established phrasing — "Vérifié via curl … ; pas de vérification visuelle dans un vrai navigateur" — rather than claiming it works.
- `docs/BACKLOG.md`: when work closes an item, check it off and add a "what was actually verified" note; don't delete the line.
- `docs/backend/AI_MODEL_BENCHMARK.md` and `docs/backend/VECTOR_DB_ALTERNATIVES.md` are dated logs/comparisons: add a new dated entry rather than rewriting history, and only with data you actually collected.

## Running the app to verify (only when a claim needs it)

This machine runs unrelated Docker projects on a shared host and a shared `chatbot-proxy` network. **Never filter `docker ps` by a name substring** — list `docker ps --format '{{.Names}}\t{{.Ports}}'` and match exact container names (`chatbot-symfony`, `chatbot-symfony-nuxt`), confirming ports before curling. The backend has no local `php`/`composer`: run them via `docker exec chatbot-symfony …`.

## Wrap-up

- Do not commit unless asked. If asked, follow `semantic-commit-messages` (`docs(<scope>): 📝 <description>`), with no AI attribution trailers in this repo.
- Report briefly: files changed and why (one line each), which claims were checked against code vs. only read, and anything stale you noticed but couldn't confidently fix. If nothing needed updating, say so.
