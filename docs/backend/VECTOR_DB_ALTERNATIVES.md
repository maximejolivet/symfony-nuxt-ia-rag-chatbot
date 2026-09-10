# Alternatives à Qdrant Cloud

Comparatif des bases vectorielles managées face à Qdrant Cloud (utilisé aujourd'hui
en prod, `QDRANT_HOST`/`QDRANT_PORT`/`QDRANT_API_KEY`, voir `docs/DEPLOYMENT.md`).
Chiffres vérifiés sur les pages tarifs officielles au 2026-09-10 -- comme les paliers
gratuits changent souvent (Weaviate est passé d'un sandbox 14 jours à un palier
permanent en juin 2026), revérifier les sources avant de s'y fier si ce fichier a
plus de quelques mois.

## Pourquoi ce comparatif

`backend/src/VectorConnector/QdrantClient.php` est un client HTTP maison minimal :
`ensureCollection` (créer), `upsert` (indexer des points), `search` (requête par
vecteur + filtres), `delete`. Aucune fonctionnalité Qdrant-spécifique avancée
utilisée (pas de quantization, pas de multi-vecteur, pas de hybrid search
côté Qdrant -- la recherche hybride de cette app fusionne Qdrant + FULLTEXT MariaDB
en RRF côté application, voir `docs/backend/SPECIFICATION.md` §6.5). N'importe quel
fournisseur avec une API REST équivalente est donc un remplacement réaliste, pas
une réécriture d'architecture.

## Recommandation actuelle

**Upstash Vector**, si une migration devient utile un jour (ex. Qdrant Cloud suspend
le cluster gratuit après une semaine d'inactivité, ce qui peut arriver vu le trafic
faible de ce site). L'app dépend déjà d'Upstash pour `REDIS_URL` en prod (o2switch
n'a pas de Redis local, voir `docs/DEPLOYMENT.md`) -- consolider sur le même
fournisseur simplifie la gestion (un compte, une facture) sans perte de
fonctionnalité pour ce cas d'usage (échelle : un CV + quelques documents, faible
trafic). Pinecone reste la meilleure alternative si on préfère ne pas dépendre
d'Upstash pour les deux briques (cache ET vecteurs).

Aucune migration n'a été faite à ce jour -- ce fichier documente une comparaison,
pas une décision actée.

## Comparatif (2026-09-10)

| Solution | Palier gratuit | Points forts pour ce projet | Points bloquants |
|---|---|---|---|
| **Qdrant Cloud** (actuel) | 0,5 vCPU / 1 Go RAM / 4 Go disque, ~1M vecteurs 768-dim, permanent mais suspendu après 1 semaine d'inactivité (supprimé après 4 semaines) | Déjà en place, client REST déjà écrit et testé | Suspension après inactivité -- risque réel vu le trafic de ce site |
| **Upstash Vector** | 10 000 vecteurs, 10 000 requêtes/jour, jusqu'à 10 index, dimension max 1536 | Même fournisseur que le Redis déjà en prod (un compte/une facture de plus en moins), API REST tout aussi simple | Quota de requêtes/jour plus serré que Qdrant si le trafic grossit fortement |
| **Pinecone** | 2 Go de stockage, 2M write units/mois, 1M read units/mois, 5 index (100 namespaces chacun) | Le plus mature et documenté du marché, API REST directe (pas de SDK PHP officiel mais HTTP simple comme Qdrant) | Suspend les index après 3 semaines d'inactivité (même souci que Qdrant), limité à la région us-east-1 |
| **Zilliz Cloud** (Milvus managé) | 5 Go de stockage, 5 collections, 2,5M vCU/mois | Volume généreux | API Milvus plus lourde/complexe qu'il n'en faut pour ce cas d'usage simple |
| **MongoDB Atlas Vector Search** | Cluster M0 : 512 Mo de stockage seulement | -- | Introduirait une deuxième base de données (Mongo) en plus de MariaDB déjà en place, complexité inutile pour ce projet |
| **Weaviate Cloud** | Depuis juin 2026, palier permanent (avant : sandbox 14 jours) : 100 000 objets, 1 Go RAM, 10 Go disque, **1 seule collection** (jusqu'à 3 tenants) | Récemment devenu vraiment gratuit sans limite de temps | Le multi-agent de cette app crée une collection Qdrant par agent (`agent_{id}_collection`) -- incompatible avec la limite d'1 collection, sauf à tout regrouper via les "tenants" Weaviate (max 3, donc ≤3 agents) |

## Sources (vérifiées 2026-09-10)

- [Qdrant Pricing](https://qdrant.tech/pricing/)
- [Vector Pricing — Upstash](https://upstash.com/pricing/vector)
- [Pinecone Pricing 2026 — CostBench](https://costbench.com/software/vector-databases/pinecone/)
- [Zilliz Cloud Pricing](https://zilliz.com/pricing)
- [Atlas Free Cluster Limits — MongoDB Docs](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [Weaviate Cloud is now free to start — Weaviate Blog](https://weaviate.io/blog/weaviate-free-tier)
- [Weaviate Pricing](https://weaviate.io/pricing)

## Historique

### 2026-09-10 -- comparatif initial

Premier comparatif, déclenché par une question exploratoire ("d'autres solutions
que Qdrant Cloud ?"), sans incident en prod à l'origine (contrairement à
`AI_MODEL_BENCHMARK.md`, dont le premier run venait d'une panne réelle). Aucune
migration décidée -- à mettre à jour si Qdrant Cloud pose un problème concret
(suspension du cluster gratuit, limite de volume atteinte) ou si les paliers
gratuits ci-dessus changent.
