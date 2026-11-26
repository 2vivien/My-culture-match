# ADR-006 — Stockage médias : MinIO (S3-compatible)

## Contexte
Avatars, photos de posts, vidéos, notes vocales, fichiers du chat. Il faut un stockage
d'objets scalable avec uploads directs (presigned URLs) pour ne pas faire transiter les fichiers par l'API.

## Options étudiées
1. **MinIO** (retenu) — self-hosted, API AWS S3, gratuit
2. AWS S3 direct dès V1 (coût, besoin cloud)
3. Stockage local sur disque (non scalable, pas de CDN)
4. Service de stockage SaaS (Cloudinary etc. — dépendance propriétaire)

## Décision
**MinIO** comme backend S3-compatible, avec **presigned URLs** (PUT direct client → MinIO)
et Cloudflare CDN en production.

## Pourquoi
- API 100 % compatible S3 → migration vers AWS S3 possible **sans refonte**.
- Self-hosted → pas de coût par octet en dev/staging.
- Presigned URLs → les gros fichiers (vidéos 100 MB) ne passent jamais par le serveur API.
- Traitement async via BullMQ (`media.process` : Sharp images, FFmpeg vidéo/audio).

## Conséquences
- Un service MinIO de plus à opérer (backups, lifecycle).
- Validation stricte côté serveur (MIME whitelist, taille max) avant de signer une URL.
- Structure de buckets : `avatars/`, `posts/`, `messages/`, `stories/` sous `mcm-media`.

## Évolution future
En prod : soit MinIO clusterisé + Cloudflare, soit bascule directe AWS S3 (même code client).
