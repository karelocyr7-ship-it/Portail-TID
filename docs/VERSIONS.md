# Versions retenues

| Composant      |             Version | Statut                                   |
| -------------- | ------------------: | ---------------------------------------- |
| Debian         |                13.6 | VM auditée                               |
| Linux          | 6.12.86+deb13-amd64 | VM auditée                               |
| Git            |              2.47.3 | présent                                  |
| Codex CLI      |             0.145.0 | présent                                  |
| Docker Engine  |              29.6.2 | installé depuis le dépôt officiel Docker |
| Docker Compose |               5.3.1 | plugin officiel installé                 |
| Docker Buildx  |              0.35.0 | plugin officiel installé                 |
| Node.js        |             24.18.0 | binaire officiel LTS vérifié par SHA-256 |
| npm            |             11.16.0 | fourni avec Node.js                      |
| pnpm           |             10.12.1 | version épinglée du workspace            |
| Next.js        |             16.2.11 | version stable retenue                   |
| React          |              19.2.8 | version retenue                          |
| TypeScript     |               5.9.3 | version retenue                          |
| ESLint         |              9.39.5 | version retenue                          |
| Prisma         |               7.9.0 | version retenue                          |
| Vitest         |              4.1.10 | version retenue                          |
| Playwright     |              1.61.1 | version retenue pour la recette          |
| PostgreSQL     |               16.10 | image épinglée dans Compose              |
| Keycloak       |              26.6.2 | image épinglée dans Compose              |
| Caddy          |              2.11.3 | image épinglée dans Compose              |
| n8n            |              2.30.5 | image épinglée dans Compose              |
| Uptime Kuma    |               2.3.2 | image épinglée dans Compose              |

Les versions ont été vérifiées dans les releases officielles le 22 juillet
2026. Elles doivent être revalidées avant une future mise à jour.
