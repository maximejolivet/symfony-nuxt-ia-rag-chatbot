# Documentation — Chatbot IA

![docs](https://img.shields.io/badge/docs-12%20pages-informational)
![format](https://img.shields.io/badge/format-Markdown-000000?logo=markdown&logoColor=white)

Index de tous les fichiers Markdown du dépôt.

## Racine

- [README.md](../README.md) — présentation générale du projet full-stack
- [docs/ONBOARDING.md](ONBOARDING.md) — guide d'onboarding : stack, architecture, commandes, conventions, points d'attention
- [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) — procédure de déploiement (backend Symfony sur o2switch, frontend Nuxt sur Vercel)
- [SECURITY.md](../SECURITY.md) — politique de sécurité et signalement de vulnérabilités

## Backend

- [backend/README.md](../backend/README.md) — stack, installation et organisation du backend Symfony
- [docs/backend/SPECIFICATION.md](backend/SPECIFICATION.md) — cahier des charges du backend
- [docs/backend/ADMIN.md](backend/ADMIN.md) — guide des pages du backoffice `/admin` (Menu et Pages hors menu)
- [docs/backend/AI_MODEL_BENCHMARK.md](backend/AI_MODEL_BENCHMARK.md) — journal de benchmark des modèles de chat gratuits OpenRouter (disponibilité, tool-calling, concision)
- [docs/backend/VECTOR_DB_ALTERNATIVES.md](backend/VECTOR_DB_ALTERNATIVES.md) — comparatif des bases vectorielles managées face à Qdrant Cloud (paliers gratuits, compatibilité avec le multi-agent)

## Frontend

- [docs/frontend/SPECIFICATION.md](frontend/SPECIFICATION.md) — cahier des charges du frontend Nuxt/Vue (widget de chat)

## Chantier

- [docs/BACKLOG.md](BACKLOG.md) — backlog de pistes d'amélioration backend/frontend
- [docs/PROMPTS_SYMFONY.md](PROMPTS_SYMFONY.md) — prompts Claude Code pour équipes Symfony (revue, tests, migrations, sécurité...)

## Outillage

- [.claude/skills/semantic-commit-messages/SKILL.md](../.claude/skills/semantic-commit-messages/SKILL.md) — format des messages de commit sémantiques
- [docs/backend/bruno/](backend/bruno/) — collection [Bruno](https://www.usebruno.com/) de l'API
  (`IA & Vecteurs`, `Base de connaissances`, `Workflows`, `Chat`, `Hors menu`)
