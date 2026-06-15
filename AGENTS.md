# AGENTS.md — commands for this workspace

## Run / build
- `npm run dev` — start the Nuxt presentation app at http://localhost:3000
- `npm run build` — production build
- `npm run generate` — static export

## Quality gates (always run these after edits)
- `npm run typecheck` — `vue-tsc` type checking (Nuxt)
- `npm run lint` — ESLint flat config (`eslint.config.js`)
- `npm run format` — Prettier (`.prettierrc`)

## Terminal sample demos (tsx)
- `npm run demo:tools` — run sample 01 in Node via tsx
- `npm run demo:targets` — run sample 02 in Node via tsx
- `npm run check:samples` — print the sample registry table

## Layout
- `samples/<NN-...>/<file>.ts` — intentionally broken TypeScript code (shown in Monaco)
- `samples/index.ts` — registry mapping each file to its deep cheat-sheet markdown + mock console output
- `app.vue` — the presentation UI (sidebar + Monaco + tabbed panel)
- `composables/useMonaco.ts` — boots Monaco + the TS worker for live diagnostics
- `composables/useSamples.ts` — fetches raw sample source for the editor
- `utils/markdown.ts` — dependency-free Markdown renderer for the cheat sheet
- `server/routes/samples/[...path].ts` — serves raw sample source to the browser
