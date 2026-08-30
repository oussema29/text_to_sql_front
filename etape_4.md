# Étape 4 — Explorateur de schéma

Statut : **terminée et vérifiée en conditions réelles (contre le vrai backend, schéma réel ~90+ tables)**.
Périmètre : `/tables` + `/tables/{name}` uniquement — le diagramme `/graph` reste un fast-follow non
construit (décision déjà actée dans `BUILD_PLAN.md`/le contrat backend).

## Ce qui a été fait

- `core/models/schema.model.ts` — `TableSummaryDto`, `ColumnDto`, `ForeignKeyDto`, `TableDetailDto`,
  calqués sur les records backend (`TableSummaryDto.java`, `TableDetailDto.java`, `ColumnDto.java`,
  `ForeignKeyDto.java`).
- `core/services/schema.service.ts` — `listTables(search?)`, `getTable(tableName)`.
- `features/schema-explorer/table-list.component.*` — traduction fidèle de
  `mockups/v4/SchemaExplorerList.dc.html` : tableau (pas des cartes), recherche avec debounce 300 ms
  câblée sur `?search=`, clic sur une ligne → navigation vers `/schema/:name`.
- `features/schema-explorer/table-detail.component.*` — traduction fidèle de
  `mockups/v4/SchemaExplorerDetail.dc.html` : fil d'ariane, en-tête (nom + description), tableau des
  colonnes (nom, type + longueur si connue, nullable ✓/✗, description, exemples en chips), bloc clés
  étrangères séparé en dessous (pas fusionné dans le tableau des colonnes), chaque cible de FK est un
  lien cliquable vers la table référencée.

## Vérification (navigateur réel + backend réel, utilisateur `analyst`)

- `ng build` réussit (même avertissement préexistant de budget CSS sur `query-workspace`, non lié à
  cette étape).
- Liste : 103 tables réelles chargées et affichées (`GET /api/v1/schema/tables` → 200), descriptions et
  compteurs de colonnes corrects.
- Recherche : saisie de « compte » → 12 résultats filtrés en direct (`GET
  /api/v1/schema/tables?search=compte` → 200), debounce fonctionnel (pas un appel par frappe).
- Détail : clic sur la table `compte` → rendu correct de toutes les colonnes réelles (id, numero_compte,
  client_id, type_compte_id, devise_id, agence_id, solde, statut avec chips ACTIF/INACTIF,
  date_ouverture) et du bloc FK (`client_id → client.id`, etc.), conforme au mockup.
- Navigation FK → FK : clic sur le lien `client.id` depuis la page `compte` → navigation vers
  `/schema/client`, page entièrement remise à jour (fil d'ariane, titre, colonnes, description) sans
  passer par un rechargement complet de page. Vérifié après correction du bug ci-dessous.

## Problèmes rencontrés

- **Bug réel trouvé et corrigé : navigation entre deux pages `/schema/:name` ne rechargeait pas les
  données.** `TableDetailComponent.ngOnInit()` lisait `route.snapshot.paramMap` une seule fois. Angular
  réutilise la même instance de composant quand on navigue d'une route vers une autre qui matche la même
  configuration de route (`schema/:name` → `schema/:name`), donc `ngOnInit` ne se redéclenche pas et le
  composant continuait d'afficher les données de la table précédente alors que l'URL avait changé.
  Détecté en cliquant sur un lien de clé étrangère (`compte` → `client`) : l'URL changeait mais le
  contenu affiché restait celui de `compte`. Corrigé en s'abonnant à `route.paramMap` (Observable) au
  lieu de lire `route.snapshot.paramMap` une fois — `src/app/features/schema-explorer/
  table-detail.component.ts`. Revérifié après correction : la navigation FK → FK met bien à jour tout le
  contenu.
- **Process `ng serve` obsolète après création des nouveaux fichiers de composants** — même piège que
  documenté dans `etape_2.md` et `etape_3.md` (troisième occurrence). Résolu de la même façon
  (`Get-NetTCPConnection` pour identifier le process réel, `Stop-Process`, relance propre).
- **Faux négatif pendant la vérification du clic sur lien FK** : les premières tentatives de clic
  automatisé (outil de navigateur, coordonnées pixel) sur le lien `client.id` n'ont déclenché aucune
  navigation, alors que l'URL et le DOM étaient corrects (confirmé via `getBoundingClientRect()` en
  JavaScript direct sur la page — le lien était bien présent aux coordonnées attendues). Un
  `element.click()` déclenché directement en JavaScript a fonctionné immédiatement, confirmant que le
  bug de routing ci-dessus était le seul vrai problème et que l'échec des clics précédents était un
  problème de l'outillage d'automatisation (mapping de coordonnées), pas un bug de l'application.

## Points non vérifiés / limitations connues

- **`GET /api/v1/schema/graph` (diagramme FK) non construit** — décision déjà actée : fast-follow, pas
  dans le périmètre de cette étape ni du build order actuel.
- Testé uniquement avec `analyst`. L'explorateur de schéma est accessible à tout utilisateur authentifié
  (pas de restriction de rôle côté backend sur `/schema/*`), donc pas de comportement différent attendu
  pour `admin`, mais pas revérifié visuellement.
- Pas de test d'une table inexistante (chemin `notFound()` du composant détail) en conditions réelles —
  le code gère le 404 (`GlobalExceptionHandler` → `{error: ...}`) mais ce chemin n'a été vérifié que par
  lecture du code, pas par un clic réel sur une URL invalide.