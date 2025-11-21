# Repository Guidelines

## Project Structure & Module Organization
- `client/`: Vue 3 + Vite + TypeScript + Tailwind UI. Entry in `src/main.ts`, root layout in `src/App.vue`, chat UI in `src/components/`, state in `src/stores/`, and socket logic in `src/composables/useChatSocket.ts`.
- `server/`: Node.js + TypeScript WebSocket server. `src/index.ts` handles connections and message types, `src/store.ts` keeps in-memory data, `src/types.ts` defines payloads, `src/redis.ts` wraps optional Redis access; builds emit to `dist/`.
- `electron/`: Desktop wrapper pointing at the running web client. `src/main.ts` is the main process; `src/preload.ts` bridges to the renderer.
- `docker-compose.yml`: Optional Redis service (password `imchat2024`) for persistence experiments; not required for the basic demo.

## Build, Test, and Development Commands
- Install: `cd server && npm install && cd ../client && npm install && cd ../electron && npm install`.
- Dev web: `cd server && npm run dev` (ws://localhost:8080), `cd ../client && npm run dev` (http://localhost:3000).
- Dev desktop: after server+client are running, `cd electron && npm run dev`.
- Build: `cd client && npm run build`, `cd ../server && npm run build`, `cd ../electron && npm run build` (uses `tsc`, `vue-tsc`, Vite).
- Run compiled: `cd server && npm start` for the built server; `cd electron && npm start` to launch the packaged app against the running client.
- Infra: `docker-compose up -d redis` (or `cd server && npm run docker`) to start Redis locally.

## Coding Style & Naming Conventions
- TypeScript-first across packages; use 2-space indentation, single quotes, and avoid semicolons to match existing files.
- Vue SFCs use `<script setup>`; components and composables are PascalCase, Pinia stores are noun-based (e.g., `auth`, `chat`).
- Keep Tailwind utility classes readable (group by layout/spacing/typography), and prefer small helpers over inline business logic.

## Testing Guidelines
- No automated test suite is configured. Favor thin, easily testable functions and add scriptable checks before landing changes.
- For now, perform manual flows: register two users, verify DM + group chat, send image upload, confirm typing indicators and message status changes.
- If adding tests, colocate them under a `__tests__` folder near the code and document any new scripts in `package.json`.

## Commit & Pull Request Guidelines
- Write concise, imperative commit subjects (e.g., `Add reconnect backoff`, `Fix message status updates`).
- Scope commits by package when helpful (`client: ...`, `server: ...`, `electron: ...`).
- PRs should include: a short summary of behavior change, steps to reproduce/verify (commands + expected results), screenshots or recordings for UI tweaks, and notes about any Redis/WebSocket config expectations.

## Security & Configuration Notes
- Default WebSocket endpoint is `ws://localhost:8080`; adjust client/env wiring before deploying elsewhere.
- Redis password in `docker-compose.yml` is for local development only; rotate it and use env vars for any shared environment.
- Persistent storage is minimal; server restarts clear in-memory data unless Redis is enabled. Plan migrations before introducing real data.
