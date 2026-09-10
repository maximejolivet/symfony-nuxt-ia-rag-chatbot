# Benchmark des modèles de chat gratuits (OpenRouter)

Journal de suivi de la fiabilité et de la qualité des modèles `:free` d'OpenRouter
candidats pour `AiProviderConfig` (`usage = chat`, provider `api_endpoint`), utilisés
par l'agent recruteurs. Mis à jour à chaque nouveau test, jamais réécrit à zéro --
chaque run garde ses résultats sous sa propre date pour repérer les tendances de
disponibilité (voir §Pourquoi un journal, pas un instantané).

## Recommandation actuelle

**`liquid/lfm-2.5-2.6b:free`** reste le modèle actif (`openrouter-chat-recruteurs`,
voir `/admin/ai-provider-configs`). C'est le seul testé à ce jour qui remplit les
deux conditions non négociables de cette app :

1. **Disponibilité stable** sur plusieurs jours de test (voir §Historique).
2. **Tool-calling fiable** pour le workflow `planifier_entretien` (`lister_creneaux_disponibles`
   + `planifier_entretien`, voir `ChatOrchestrationService`) -- sans ça, la prise de
   rendez-vous est cassée silencieusement.

La concision (`CHAT_MAX_TOKENS`, règle de format dans le system prompt, voir
`ChatOrchestrationService::DEFAULT_SYSTEM_PROMPT`) est gérée côté prompt/code, pas
en changeant de modèle -- voir §Le piège du raisonnement caché ci-dessous avant de
considérer un modèle "plus concis nativement" comme un candidat automatique.

## Méthodologie

Deux appels directs à `https://openrouter.ai/api/v1/chat/completions` (même clé que
`openrouter-chat-recruteurs`), reproduisant les conditions réelles :

- **Test chat** : le system prompt de production (règle de format + persona +
  extrait de document RAG factice) + une question recruteur en français.
  Mesuré : statut HTTP, latence, `finish_reason`, `completion_tokens` vs
  `reasoning_tokens` (voir piège ci-dessous), nombre de phrases/mots de la réponse.
- **Test tool-calling** : même system prompt + un message qui doit déclencher
  `lister_creneaux_disponibles` (spec de l'outil fournie). Mesuré : le modèle
  appelle-t-il l'outil, avec des arguments plausibles ?

Chaque candidat gratuit disponible sur OpenRouter au moment du test peut être ajouté
-- `curl -s https://openrouter.ai/api/v1/models | jq '.data[] | select(.id | endswith(":free"))'`
donne la liste et `.supported_parameters` dit si `tools` est supporté (l'exclure
sinon, comme `nvidia/nemotron-3.5-content-safety:free`).

## Le piège du raisonnement caché

Plusieurs modèles gratuits (`liquid/lfm-2.5-2.6b`, `nex-n2.5-mini`,
`ling-3.0-flash-fin`...) font du raisonnement en chaîne **obligatoire et non
désactivable** avant de produire la réponse réelle (OpenRouter renvoie *"Reasoning
is mandatory for this endpoint and cannot be disabled"* si on essaie
`reasoning: {enabled: false}`). Ce raisonnement consomme une part -- parfois 80-90%
-- du budget `max_tokens`, de façon variable d'un appel à l'autre.

**Conséquence directe vécue en production le 2026-09-09** : `CHAT_MAX_TOKENS` abaissé
à 250 → le raisonnement caché a consommé tout le budget → réponse vide
(`finish_reason: "length"`, `content: null`) servie aux visiteurs du site. Un modèle
qui semble "plus concis" dans un test isolé peut simplement avoir un raisonnement
plus court ce jour-là, pas un raisonnement absent -- ne jamais réduire
`CHAT_MAX_TOKENS` sans revérifier `usage.completion_tokens_details.reasoning_tokens`
sur plusieurs appels au modèle concerné. `nex-n2.5-mini` a par exemple échoué le
test tool-calling même à 900 tokens (811 consommés en raisonnement, jamais d'appel
d'outil émis).

Certains modèles (`nvidia/nemotron-3.5-lightning:free` observé le 2026-09-10) ne
cachent même pas ce raisonnement -- il sort tel quel dans `content` ("Here's a
thinking process: 1. Analyze...", 526 mots), donc visible par l'utilisateur final.
Disqualifiant tel quel.

## Historique

### 2026-09-10 -- benchmark complet (8 modèles)

Prompt système : persona agent recruteurs + règle de format (3-5 phrases, ~100 mots)
+ extrait CV factice. Question chat : "quelles sont ses competences techniques
principales en backend ?". Message tool : "Je voudrais planifier un entretien avec
Maxime la semaine prochaine, plutot en visio."

| Modèle | Chat | Tool-calling | Verdict |
|---|---|---|---|
| `liquid/lfm-2.5-2.6b:free` (actif) | 200, 5 phrases/55 mots, ~80% budget en raisonnement, latence ~4s | OK (nécessite ≥900 tokens de marge, sinon échoue par manque de budget) | **Retenu** |
| `nex-agi/nex-n2.5-mini:free` | 200, le plus concis testé (4 phrases/40 mots), latence ~2s | Échoue même à 900 tokens (811 consommés en raisonnement, jamais d'appel émis) | Éliminé -- casserait la prise de RDV |
| `inclusionai/ling-3.0-flash-fin:free` | 200, correct mais tronqué à 900 tokens (`finish_reason: length`) | OK, arguments plausibles | Solide mais variante spécialisée finance (`-fin`), pertinence générale à vérifier |
| `nvidia/nemotron-3-super-120b-a12b:free` | 502 "Upstream error from Nvidia: Service temporarily overloaded" pendant ce run | OK (avait fonctionné le 2026-09-09) | Capacité instable côté Nvidia |
| `nvidia/nemotron-3.5-lightning:free` | 200 mais raisonnement complet exposé en `content` (526 mots, non tronqué visuellement) | Non testé (déjà disqualifié) | Inutilisable tel quel |
| `google/gemma-4-31b-it:free` | 429 `upstream_provider_shared_pool` (Google AI Studio saturé) | 429 idem | Indisponible -- 2e jour de suite |
| `google/gemma-4-26b-a4b-it:free` | 429 idem | 429 idem | Indisponible -- 2e jour de suite |
| `poolside/laguna-xs-2.1:free` | 429 `upstream_provider_shared_pool` | 429 idem | Indisponible |

### 2026-09-09 -- premier remplacement testé (contexte : verbosité de `liquid`)

- `google/gemma-4-31b-it:free` activé en prod suite à ce constat initial (30,7B
  dense, bien noté sur le suivi d'instructions) → **429 quelques heures plus tard**,
  `upstream_provider_shared_pool` saturé côté Google AI Studio. Site cassé le temps
  du revert vers `liquid/lfm-2.5-2.6b:free`.
- Vérification à chaud (`/api/v1/auth/key`, `/api/v1/chat/completions` direct) :
  `liquid/lfm-2.5-2.6b:free` répondait 200 pendant que `gemma-4-31b-it:free` et
  `gemma-4-26b-a4b-it:free` répondaient 429 sur la même clé -- confirme un problème
  spécifique à ces modèles (pool partagé saturé), pas un quota de compte épuisé.
- `nvidia/nemotron-3-super-120b-a12b:free` et `nvidia/nemotron-3.5-lightning:free`
  répondaient 200 ce jour-là (voir leur comportement différent le lendemain
  ci-dessus -- disponibilité non garantie d'un jour à l'autre pour les modèles gratuits).

## Comment relancer ce benchmark

Script utilisé pour le run du 2026-09-10 : appels directs à l'API OpenRouter avec la
clé de `openrouter-chat-recruteurs`, system prompt de production, un test chat +
un test tool-calling par modèle, résultats horodatés dans ce fichier. Pas de script
committé dans le repo à ce jour (vécu comme un script jetable en scratchpad) --
si ça devient récurrent, envisager de le committer sous
`backend/bin/benchmark-chat-models.php` ou similaire plutôt que de le
reconstruire à chaque fois.
