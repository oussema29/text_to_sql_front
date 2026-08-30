Continue le développement du frontend Angular BanQuery dans ce dossier (`frontend/`), dans ce
répertoire de travail `C:\stage pfa\projet\` qui contient aussi `backend/`.

Avant de faire quoi que ce soit, lis dans cet ordre :
1. `frontend/BUILD_PLAN.md` — le plan de build, l'ordre des étapes, le statut actuel (étapes 1 et 2
   terminées), et la section "Open decisions not yet resolved".
2. `frontend/etape_1.md` et `frontend/etape_2.md` — ce qui a déjà été construit et vérifié, avec les
   problèmes rencontrés.
3. `backend/front_end_preparation/front_end_preparation.md` — le contrat API complet (endpoints, DTOs,
   flux page par page), vérifié contre le vrai code backend.
4. `backend/front_end_preparation/problems_between_front_back.md` — les décisions déjà prises sur les
   écarts entre backend et frontend (toutes implémentées côté backend).
5. `backend/front_end_preparation/mockups/v4/` — le design approuvé (fichiers `.dc.html`), à traduire
   fidèlement en composants Angular réels.
6. Le code déjà écrit dans `frontend/src/` — c'est la source de vérité la plus fiable sur ce qui existe
   réellement, plus fiable que n'importe quelle description.

Continue à partir de l'étape 3 du build order (`BUILD_PLAN.md`), sauf si tu trouves un problème dans
les étapes 1-2 qui doit d'abord être corrigé.

**Règle obligatoire, à respecter à chaque étape, sans exception** : une fois une étape terminée ET
vérifiée, crée (ou mets à jour) un fichier `frontend/etape_N.md` (N = le numéro de l'étape) qui
détaille :
- ce qui a été construit (fichiers créés/modifiés, décisions prises)
- comment ça a été vérifié — build + navigateur réel + backend réel, jamais "ça compile" comme seule
  preuve
- tout problème rencontré, même mineur, et comment il a été résolu (ou pourquoi il reste ouvert)
- tout point non vérifié ou toute limitation connue

Le but : que n'importe qui (l'utilisateur, ou une future session sans mémoire de celle-ci) puisse
comprendre exactement où en est le projet rien qu'en lisant ces fichiers, sans avoir à relire tout
l'historique de conversation. Ne marque jamais une étape "terminée" dans `BUILD_PLAN.md` sans avoir
écrit son `etape_N.md` correspondant.

**Identifiants de test réels** (backend déjà seedé, `V10__seed_test_users.sql`) :
- `admin` / `admin1234` (rôle ADMIN)
- `analyst` / `analyst1234` (rôle ANALYST)

**Pour tester en conditions réelles** : le backend doit tourner (`docker-compose up -d` puis
`./mvnw spring-boot:run` dans `backend/`, voir `backend/CLAUDE.md`), et le serveur de dev Angular
(`ng serve` dans `frontend/`, proxy déjà configuré vers `localhost:8080`). Vérifie toujours dans un
vrai navigateur, pas seulement que ça compile.

**Piège déjà rencontré à éviter** : si tu lances `ng serve` en arrière-plan et qu'un port est déjà
occupé, ne suppose jamais que l'ancien processus a disparu — vérifie explicitement (ex.
`Get-NetTCPConnection -LocalPort 4300`) avant de conclure qu'un nouveau serveur tourne, sinon tu risques
de tester contre une version obsolète de l'app sans t'en rendre compte (voir `etape_2.md` pour le détail
de cet incident).

**Décision encore en suspens** : le titre de la page de connexion ("L'assistant data interne de la
BTE, en langage naturel.") a été jugé faible — plusieurs alternatives ont été proposées mais aucune
n'a été choisie. Demande à l'utilisateur avant de le finaliser, ne choisis pas seul.