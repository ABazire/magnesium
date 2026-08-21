# Changelog

Toutes les évolutions notables de Magnesium sont documentées dans ce fichier.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
versioning selon [Semantic Versioning](https://semver.org/lang/fr/).

## [0.1.0] — 2026-08-21

### Ajouté

- Authentification par pseudo (NextAuth)
- Création de personnages avec stats aléatoires
- Système de rareté (1★ à 6★)
- Moteur de combat tactique (initiative, esquive, dégâts)
- Gatcha de personnages (monnaie + tirage pondéré)
- Équipement (4 emplacements) et coffres
- Arène avec matchmaking par puissance proche
- Interface complète (5 écrans, direction artistique émeraude)
- Déploiement en production (Vercel)

## [0.2.0] — 2026-08-21

### Ajouté

- Système d'Aventure (PvE) : combats contre des monstres à stats fixes (loup, ours), récompenses en monnaie et chance de coffre

### Modifié

- La navigation "Combat" est remplacée par "Aventure" ; l'arène reste dédiée au PvP

### Supprimé

- Boutons de test "[DEV] +100 monnaie", devenus inutiles grâce à l'aventure
