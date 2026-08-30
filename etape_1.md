# Étape 1 — Scaffold

Statut : **terminée et vérifiée**.

## Ce qui a été fait

- `ng new frontend` dans `C:\stage pfa\projet\frontend` (routing activé, style SCSS, gestionnaire npm).
- Ajout d'Angular Material (`ng add @angular/material`) avec thème custom, typographie Roboto, animations activées.
- Thème rebrandé aux couleurs BTE dans `src/styles.scss` : navy `#17235E`, gold `#E7A83A`, maroon `#9C1B32`,
  appliqués par-dessus la palette M3 générée (variables `--mat-sys-primary`, `--mat-sys-secondary`,
  `--mat-sys-tertiary`, plus des tokens custom `--bq-*` pour un usage direct hors composants Material).
- Polices ajoutées dans `src/index.html` : Roboto (400-700), Roboto Mono (blocs SQL), Public Sans
  (titres, voir mockup v4).
- `app.config.ts` : `provideRouter`, `provideAnimationsAsync`, `provideHttpClient` (interceptors ajoutés
  à l'étape 2).
- `app.html` nettoyé (juste `<router-outlet />`, plus le template de démonstration par défaut d'Angular).
- Titre de l'app mis à "BanQuery", `<html lang="fr">`.

## Vérification

- `ng build` réussit (bundle initial ~222 kB, aucune erreur).
- `ng serve` démarré et répond en HTTP 200 avec le bon `<title>BanQuery</title>` et les bons liens de polices.

## Problèmes rencontrés

- **`@angular/animations` manquant.** `provideAnimationsAsync()` nécessite le paquet `@angular/animations`,
  qui n'est pas installé par défaut avec `ng new` + `ng add @angular/material` sur cette version — le build
  échouait avec `Could not resolve "@angular/animations/browser"`. Corrigé par `npm install
  @angular/animations@22`. Angular affiche un avertissement de dépréciation sur ce paquet (recommandant la
  nouvelle syntaxe native `animate.enter`/`animate.leave`), mais il reste nécessaire pour les transitions
  internes des composants Material sur cette version — pas d'action requise pour l'instant, juste à
  surveiller si Angular Material change cette dépendance dans une future release.
