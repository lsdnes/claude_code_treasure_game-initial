# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # Install dependencies
npm run dev:all   # Start both Vite (port 3000) and API server (port 3001) — use this for development
npm run dev       # Start only the Vite dev server
npm run server    # Start only the API server (node server.js)
npm run build     # Build to ./build/
```

No lint or test scripts are configured.

## Architecture

Two-process app: a React + TypeScript frontend (Vite, port 3000) and an Express API server (`server.js`, port 3001). All game UI logic lives in `src/App.tsx`; there are no additional route pages or context providers.

**Frontend → Backend flow:**
- Vite proxies `/api/*` to `localhost:3001` (configured in `vite.config.ts` or via the dev server)
- Auth uses JWT tokens stored in `localStorage` (`game_token`, `game_username`) and sent as `Authorization: Bearer <token>` headers
- Guest mode skips auth entirely and never calls the API

**Game mechanics:** 3 treasure chests are rendered, one randomly assigned treasure. Clicking a closed chest opens it, awards +$100 (treasure) or -$50 (skeleton), and ends the game when treasure is found or all boxes opened. Scores are saved to the API on game end for signed-in users only.

**Key state in `App`:**
- `boxes: Box[]` — array of `{ id, isOpen, hasTreasure }`
- `score: number`
- `gameEnded: boolean`
- `user: { username, token } | null` — null when playing as guest
- `isGuest: boolean`

**API server (`server.js`):**
- SQLite database (`game.db`, created automatically) via `better-sqlite3`
- Tables: `users` (id, username, password_hash, created_at) and `scores` (id, user_id, score, played_at)
- Endpoints: `POST /api/signup`, `POST /api/signin`, `POST /api/scores` (auth required), `GET /api/scores` (auth required, returns last 20)
- Passwords hashed with `bcryptjs`; JWT secret defaults to `'treasure-hunt-secret-key'` (override via `JWT_SECRET` env var)

**Components:**
- `src/components/AuthModal.tsx` — sign-in/sign-up dialog using shadcn Tabs + Dialog
- `src/components/ui/` — shadcn/ui components (Radix UI + Tailwind). Import from `@/components/ui/<name>`. The `@` alias resolves to `src/`.

**Assets:**
- `src/assets/` — chest images (`treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`)
- `src/audios/` — `chest_open.mp3` (treasure), `chest_open_with_evil_laugh.mp3` (skeleton)

**Animations:** Uses `motion/react` (Motion library) — `motion.div` with `whileHover`, `whileTap`, `animate` props. Audio plays via `new Audio(...).play()` outside setState to avoid double-play in React Strict Mode.

**Styling:** Tailwind CSS with amber color palette as the primary theme. Global styles in `src/styles/globals.css` and `src/index.css`.
