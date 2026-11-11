# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Doshi is a Japanese vocabulary app for **iOS and Android** (a beginner-friendly Anki alternative) built on Expo SDK 58 + Expo Router + strict TypeScript. It has a working learning loop — lessons (new words + quick check), FSRS reviews, and local progress in SQLite — plus a Dictionary of learned words (each word's page shows an example sentence) and a Settings tab (a Study pace screen with scheduling presets, hiragana reading level, romaji, appearance, Credits, placeholder Account rows), but no accounts or sync yet. The word list is Kaishi 1.5k (`data/words.json`, see Content licensing). See README.md for the roadmap and open decisions (audio, pitch accent display, auth provider, feedback colors). Don't treat undecided items as settled.

Architecture of the loop:
- `lib/srs/` — the only code that touches `ts-fsrs` (`scheduler.ts`), plus the 4 am day boundary (`day.ts`) and today's summary (`summary.ts`, which also applies the daily review limit). Pure, unit-tested in `lib/srs/__tests__/`. FSRS is pinned to **FSRS-6** (whole days; ts-fsrs 6 defaults to FSRS-7, which schedules a failed word seconds later without learning steps). Never change the version without migrating stored cards.
- Scheduling settings (new words a day, daily review limit, desired retention) are preset choices defined in `constants/lesson.ts`, shown on the Study pace screen (`app/study-pace.tsx`, pushed from the Settings tab), stored in `settings` and held in progress state. `lib/progress.ts` creates one scheduler per retention choice at startup so a change applies to the next grade synchronously.
- `lib/db.ts` — all SQL. Tables: `cards`, append-only `review_log` (UUID ids, UTC ms, and the desired retention each grade used, so the log stays replayable; the one exception is undo, which deletes a word's latest grade — sync will need tombstones for that), `settings`. Schema changes are new entries in `MIGRATIONS` (tracked by `PRAGMA user_version`); never edit a shipped one.
- `lib/progress.ts` — in-memory progress loaded once at startup (root layout waits for it), written through to SQLite in order. Also owns `now()`, which the dev time-travel tool shifts — use `now()`, never `Date.now()`, for anything scheduling-related.
- `lib/today.ts` / `lib/lesson-session.ts` — what's due, what's next, and the words in the open lesson.
- Dev-only tools on Home (`__DEV__`): advance time by a day/week, reset progress.

## Commands

The package manager is **pnpm** (Node >= 22.13, see `.nvmrc`). Prefer `pnpm exec` over `npx` — npx prints a harmless `Unknown project config "node-linker"` warning.

```bash
pnpm install
pnpm start                      # Expo dev server (i / a to pick a target)
pnpm ios | pnpm android
pnpm typecheck                  # tsc --noEmit
pnpm lint                       # expo lint (eslint-config-expo flat config)
pnpm test                       # jest (add -- --watch while developing)
pnpm exec expo install <pkg>    # ALWAYS use this to add deps (SDK-compatible versions)
pnpm dlx expo-doctor            # not a local dependency, so exec won't find it
pnpm exec expo install --fix
```

Run `pnpm typecheck`, `pnpm lint` and `pnpm test` (Jest via `jest-expo`) before declaring a task done. TypeScript 6 doesn't load `@types` packages automatically, so test files start with `/// <reference types="jest" />`.

## Platforms

The app targets **iOS and Android only**. Web is not a target: don't use web builds to verify or screenshot UI work (web has no notch, status bar, or safe-area insets, so layout bugs slip through), and don't spend effort on web-specific behavior. Check UI changes in the iOS Simulator or Android emulator. The Expo template's web scaffolding has been removed; don't add `react-native-web`/`react-dom` or a `web` config back unless web becomes a goal.

## Repo-specific notes

- Routes live in `app/` at the repo root; non-route code goes in top-level `constants/`, `hooks/`, etc. The `@/*` alias maps to the repo root (e.g. `@/constants/theme`).
- `.npmrc` must keep `node-linker=hoisted` — pnpm's symlinked layout breaks Metro and native module resolution. `pnpm-workspace.yaml` allow-lists build scripts (pnpm blocks them by default); add new entries there if a dependency needs a postinstall.
- `app.json` enables `typedRoutes` and `reactCompiler` experiments.
- Everything runs in Expo Go today, including `expo-sqlite` and `expo-crypto` (both bundled in Expo Go). Only a native module that Expo Go doesn't include would require a development build.

## Styling and theming

- No styling libraries (no NativeWind/Tailwind/styled-components). Use `StyleSheet.create` only.
- `constants/theme.ts` is the single source of truth for every design value (colors, spacing, radius, font family/size, letter spacing, `maxContentWidth`). Never hardcode colors, spacing, or type sizes in screens/components.
- Colors are resolved per-render via `useTheme()` (`hooks/use-theme.ts`, OS color scheme → `colors.light`/`colors.dark`) and applied inline alongside static `StyleSheet` styles: `style={[styles.x, { color: theme.text }]}`.
- Palette: Tailwind Zinc neutrals + a single Rose brand accent in `brand` (rebranding = editing those three values).
- Semantic feedback colors (review grades like *Again*, destructive actions) are **intentionally undefined** — Rose is too close to "error" red. Don't reuse the brand accent for these; the semantic palette needs a deliberate decision first.

## Content licensing

Kaishi 1.5k has **no license** (checked Nov 2026, v2.4.3), and its sentences and translations come from the Core and Tango decks. The project owner has decided, knowing this, to ship Kaishi content — this is settled; see README "Vocabulary data".

- What ships, per word: word, reading, meaning, example sentence with its English translation, notes, and pitch accent. There is no part of speech (the deck has none).
- Kaishi's **pictures and audio never ship**. Never read the Picture, Word Audio or Sentence Audio fields in the build, and never commit the .apkg or any of its media.
- JMdict and Tatoeba are not used. Don't reintroduce them.
- Example sentences appear **only** on the Dictionary's word page (`app/word/[id].tsx`, via `components/example-sentence.tsx`). Lessons, the quick check and reviews don't show them.
- `data/words.json` is generated and committed; don't edit it by hand. Regenerate it with `python3 -I scripts/extract-kaishi-words.py ~/Documents/Kaishi.1.5k.v2.4.3.apkg`. The output must stay free of HTML, `[sound:]` tags and Anki furigana syntax, and rerunning on the same deck must give an identical file. Word ids are the notes' guids — keep them, or stored progress detaches from its words.
- `data/dictionary-words.ts` imports `data/words.json` directly and is the only place app code reads it.
- Kaishi 1.5k by donkuri is credited on the Credits screen (`app/credits.tsx`).
- `scripts/kaishi-browser.py` shows the full deck (including pictures and audio) in a local, loopback-only page for study. It reads the .apkg directly and must stay read-only and write nothing.
