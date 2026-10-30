# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Doshi is a mobile-first Japanese vocabulary app (a beginner-friendly Anki alternative) built on Expo SDK 58 + Expo Router + strict TypeScript. It is currently a **skeleton**: one landing screen, no SRS logic, data, database, auth, or backend. See README.md for the roadmap (Kaishi 1.5k dataset → FSRS engine → review UI → minimal settings → sync) and open decisions (FSRS library vs. port, expo-sqlite local-first vs. backend, auth provider). Don't treat undecided items as settled.

## Commands

The package manager is **pnpm** (Node >= 22.13, see `.nvmrc`). Prefer `pnpm exec` over `npx` — npx prints a harmless `Unknown project config "node-linker"` warning.

```bash
pnpm install
pnpm start                      # Expo dev server (i / a / w to pick a target)
pnpm ios | pnpm android | pnpm web
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # expo lint (eslint-config-expo flat config)
pnpm exec expo install <pkg>    # ALWAYS use this to add deps (SDK-compatible versions)
pnpm exec expo-doctor
pnpm exec expo install --fix
```

There is no test runner configured yet. Run `pnpm typecheck` and `pnpm lint` before declaring a task done.

## Repo-specific notes

- Routes live in `app/` at the repo root; non-route code goes in top-level `constants/`, `hooks/`, etc. The `@/*` alias maps to the repo root (e.g. `@/constants/theme`).
- `.npmrc` must keep `node-linker=hoisted` — pnpm's symlinked layout breaks Metro and native module resolution. `pnpm-workspace.yaml` allow-lists build scripts (pnpm blocks them by default); add new entries there if a dependency needs a postinstall.
- `app.json` enables `typedRoutes` and `reactCompiler` experiments.
- Everything runs in Expo Go today. Adding a native dependency (e.g. `expo-sqlite`) will require a development build.

## Styling and theming

- No styling libraries (no NativeWind/Tailwind/styled-components). Use `StyleSheet.create` only.
- `constants/theme.ts` is the single source of truth for every design value (colors, spacing, radius, font size/weight, letter spacing, `maxContentWidth`). Never hardcode colors, spacing, or type sizes in screens/components.
- Colors are resolved per-render via `useTheme()` (`hooks/use-theme.ts`, OS color scheme → `colors.light`/`colors.dark`) and applied inline alongside static `StyleSheet` styles: `style={[styles.x, { color: theme.text }]}`.
- Palette: Tailwind Zinc neutrals + a single Rose brand accent in `brand` (rebranding = editing those three values).
- Semantic feedback colors (review grades like *Again*, destructive actions) are **intentionally undefined** — Rose is too close to "error" red. Don't reuse the brand accent for these; the semantic palette needs a deliberate decision first.

## Content licensing

Kaishi 1.5k deck licensing/attribution (and its audio rights) are **unverified**. Do not bundle deck content or audio into a distributable build without confirming terms and adding attribution.
