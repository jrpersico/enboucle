# En boucle

Tous les sons conseillés dans **En boucle**, le podcast musical de TFTC (JB & Baptiste),
groupés par épisode avec le conseil de l'animateur et les liens d'écoute — dans l'esprit de
[podchiasse.com](https://podchiasse.com).

Nuxt 4 · shadcn-vue · Tailwind v4 · TanStack Query · SQLite (`node:sqlite`, zéro dépendance).

## Dev

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

## Contenu

Un fichier par épisode dans `data/episodes/*.json` — c'est la source de vérité, éditable à la main.
Au démarrage, le serveur recharge ces fichiers dans SQLite et l'API (`/api/episodes`, `/api/episodes/:slug`) lit la base.

Pour ajouter les nouveaux épisodes :

```bash
pnpm sync
```

1. **RSS Acast** → crée/maj `data/episodes/<slug>.json`
2. **Transcript** → lu dans le cache d'Apple Podcasts sur ce Mac. Si un épisode n'en a pas,
   ouvre-le dans Podcasts.app, affiche le *Transcript* une fois, puis relance.
3. **Morceaux + conseils** → extraits du transcript par Claude (`ANTHROPIC_API_KEY=… pnpm sync`).
   Sans clé, le script s'arrête au transcript (`.data/transcripts/<slug>.txt`) : on peut remplir `tracks` à la main.
4. **Liens** → iTunes Search (Apple Music + pochette) et la page [song.link](https://song.link)
   qui liste toutes les plateformes. Spotify / YouTube : liens de recherche.

Chaque étape ne remplit que ce qui manque. Pour corriger un morceau, édite le JSON
(mets `links` à `null` pour relancer la recherche des liens).

## Contributions & votes

- **👍 / 👎** sur chaque son : un vote par visiteur (cookie anonyme), stocké dans SQLite (table `votes`).
- **Badge « ✓ Vérifié »** : mettre `"verified": true` dans le JSON de l'épisode quand un auditeur a confirmé la liste.
- **Page `/contribuer`** : signaler une erreur ou dire qu'on a vérifié un épisode (table `reports`). Pour les lire :

  ```bash
  curl -H "Authorization: Bearer $NUXT_ADMIN_TOKEN" https://<app>/api/reports
  ```

  Les personnes créditées vont dans `CONTRIBUTORS` (`app/pages/contribuer.vue`).

## Déploiement (Fly)

```bash
fly launch --no-deploy && fly volumes create enboucle_data --size 1
fly secrets set NUXT_ADMIN_TOKEN=$(openssl rand -hex 24)
fly deploy
```
