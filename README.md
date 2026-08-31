# Magnesium

Magnesium est un RPG idle/gacha en navigateur : on recrute des personnages, on les équipe,
on les fait monter en niveau via l'aventure (PvE) et l'arène (PvP 1v1 et 3v3), et on grimpe
au classement.

## Fonctionnalités

- **Recrutement (gatcha)** — tirage pondéré par rareté (1★ à 6★) contre de la monnaie ou des diamants
- **Collection & inventaire** — gestion des personnages et de leur équipement (arme, armure, bottes, amulette)
- **Aventure (PvE)** — combats contre des monstres à difficulté croissante, débloqués progressivement, limités par un système d'énergie
- **Arène (PvP)** — matchmaking par puissance proche en 1v1, et en 3v3 par classement Elo, limité par des coupons
- **Classement** — leaderboards 1v1 et 3v3
- **Coffres** — récompenses aléatoires d'équipement
- **Tutoriel** — parcours d'accueil pour les nouveaux joueurs

Le moteur de combat est déterministe (RNG seedée), et chaque combat est journalisé
(tour par tour) en base pour être rejoué côté client.

## Stack technique

- [Next.js](https://nextjs.org) (App Router) + React 19
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth](https://authjs.dev) pour l'authentification
- CSS Modules pour le style (pas de framework CSS global)

> Ce projet utilise une version modifiée de Next.js dont les conventions diffèrent du
> Next.js standard — voir [AGENTS.md](./AGENTS.md) avant de contribuer.

## Démarrer en local

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Nécessite une base PostgreSQL accessible via `DATABASE_URL` (voir `prisma/schema.prisma`).
Les migrations sont appliquées automatiquement au démarrage de `next dev` / via `prisma migrate`.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — lance le build de production
- `npm run lint` — linting ESLint
