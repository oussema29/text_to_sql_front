# Étape 2 — Auth

Statut : **terminée et vérifiée en conditions réelles (contre le vrai backend)**, sauf un point noté
ci-dessous.

## Ce qui a été fait

- `core/models/auth.model.ts` — `LoginResponse`, `CurrentUser`, `UserRole`, calqués sur le contrat
  backend (`front_end_preparation.md`).
- `core/services/auth.service.ts` — singleton `providedIn: 'root'`, état réactif via un `signal<CurrentUser
  | null>`, persistance dans `localStorage` (token + user), `login()`, `logout()`, `isAdmin()`,
  `initials()`. Suit le pattern signaux + services déjà validé avec l'utilisateur (pas de NgRx, pas de
  RxJS `BehaviorSubject` pour l'état partagé).
- `core/interceptors/auth.interceptor.ts` — attache `Authorization: Bearer <token>` à chaque requête
  sortante, lit `localStorage` directement (un intercepteur tourne hors de l'arbre de composants).
- `core/interceptors/error.interceptor.ts` — sur un `401`, déconnecte et redirige vers `/login`. Le
  toast/snackbar d'erreur partagé pour les autres statuts est prévu à l'étape 7 (une fois la forme réelle
  de `GlobalExceptionHandler` confirmée en direct, voir `front_end_preparation.md` → Known Gaps).
- `core/guards/auth.guard.ts` / `core/guards/admin.guard.ts` — guards fonctionnels, redirection vers
  `/login` ou `/` selon le cas.
- `proxy.conf.json` + `angular.json` (`options.proxyConfig`) — les requêtes `/api/*` du serveur de dev
  sont transmises à `http://localhost:8080`, pour éviter tout problème CORS sans avoir à configurer le
  backend.
- `features/login/` (`.ts`/`.html`/`.scss`) — traduction fidèle de `mockups/v4/Login.dc.html` en Reactive
  Forms Angular : logo BTE réel, motif de courbe SVG, dégradé navy/gold, formulaire avec validation,
  état de chargement (spinner), bandeau d'erreur.
- `layout/shell.component.*` — toolbar (logo + utilisateur + déconnexion) et nav latérale (Espace de
  requête / Explorateur de schéma / Journal d'audit / Métadonnées du schéma, ce dernier visible
  uniquement si `auth.isAdmin()`), avec `<router-outlet />` pour les pages enfants.
- `app.routes.ts` câblé : `/login` public, `/` (shell) protégé par `authGuard`, `/metadata*` protégé en
  plus par `adminGuard`. Les pages réelles (workspace, schema, audit, metadata) sont des composants
  placeholder pour l'instant — leur vrai contenu arrive aux étapes 3 à 6.
- Logo BTE copié dans `public/images/bte-logo.jpg`.

## Vérification (navigateur réel + backend réel)

- `ng build` réussit.
- Ouverture de `http://localhost:4300/` sans être connecté → redirection automatique vers `/login` par
  `authGuard`. ✓
- Page de connexion : rendu conforme au mockup v4 (logo réel, courbe dorée, textes, formulaire). ✓
- Soumission du formulaire avec des identifiants invalides → requête réelle
  `POST /api/v1/auth/login` envoyée au backend (qui tournait déjà sur `:8080`), réponse `401` reçue,
  interceptée, et message d'erreur affiché correctement ("Nom d'utilisateur ou mot de passe incorrect").
  Confirme que le proxy, le formulaire, et la gestion d'erreur fonctionnent de bout en bout. ✓

## Connexion réussie — vérifiée (mise à jour ultérieure)

- Testé en conditions réelles avec `admin` / `admin1234` contre le backend réel (`:8080`) et le dev
  server (`:4300`) : soumission du formulaire → `POST /api/v1/auth/login` → redirection automatique vers
  `/`, shell affiché avec toolbar ("admin" / "ADMIN") et nav latérale complète, y compris "Métadonnées du
  schéma" (confirmant que `auth.isAdmin()` fonctionne). Plus aucun point ouvert sur l'étape 2.

## Problèmes rencontrés

- **Processus `ng serve` orphelin bloquant le port 4300.** Une première tentative de lancer le serveur de
  dev en arrière-plan (avant même que les fichiers de l'étape 2 n'existent) a laissé un processus Node
  détaché qui continuait de tourner sans être suivi correctement par l'outillage — chaque tentative
  suivante de démarrer un nouveau serveur échouait silencieusement avec `Port 4300 is already in use`,
  pendant que l'ancien processus continuait de servir une version obsolète de l'app (page blanche, car il
  ne connaissait ni les routes ni les composants ajoutés depuis). Diagnostiqué en identifiant le
  processus lié au port 4300 (`Get-NetTCPConnection`), puis en le tuant (`Stop-Process`) avant de relancer
  un serveur propre. Aucune conséquence sur le code de l'app — uniquement un problème d'environnement de
  vérification.
