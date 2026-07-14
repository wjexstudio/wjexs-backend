# WJEXSTUDIO OS - Backend

This is the Node.js/Express backend for **WJEXSTUDIO OS**. 
It replaces the older Go-based backend and relies on a local Markdown knowledge base instead of a traditional database, maintaining the "No Local Database" philosophy.

## Technologies Used
- Node.js & TypeScript
- Express.js
- Prisma (Schema validation & formatting, DB syncing deferred)
- Fly.io (Dockerized Deployment)

## Architecture
This API reads Markdown and JSON files from two distinct paths:
1. `KB_ROOT`: The external knowledge base repository (contains the 12 Realms).
2. `OS_ROOT`: The governance repository (contains agent files, logs, and changelogs).

## Local Development
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

## Environment Variables
- `PORT`: (Default: 8080)
- `KB_ROOT`: Absolute path to `knowledge-base` folder.
- `OS_ROOT`: Absolute path to `wjexstudio-os` folder.

## Deployment
Deployed on **Fly.io**. The `docker-entrypoint.sh` clones both `knowledge-base` and `wjexstudio-os` dynamically into a persistent `/data` volume.
