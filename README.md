# Doshi

Learn Japanese vocabulary at a steady pace.

## Overview

Doshi is a mobile-first Japanese vocabulary app — a cleaner, friendlier alternative to
Anki aimed at beginners. Anki is powerful but its defaults, terminology, and settings
surface assume you already know how spaced repetition works. Doshi's bet is the
opposite: steady-pace learning should be what you get out of the box, for everyone,
with no configuration.

This repository is currently a **skeleton** — a correctly-configured Expo project with
a single landing screen. None of the learning features described below are implemented
yet; this README documents the plan.

## Goals

- Make a beginner productive within a minute of opening the app, with zero setup.
- Ship a scientifically-grounded review schedule as the default, not as an option.
- Keep the review loop fast enough to do on a phone, in a queue, one-handed.
- Be honest and legible about what every setting does to your learning.
- Stay mobile-first and cross-platform (iOS first, Android and web from the same code).

## Design principles

1. **Simple and delightful.** A small number of screens, restrained visuals, and a
   review flow that feels quick rather than administrative.
2. **Great defaults.** A beginner should never have to configure a scheduler to get a
   good outcome. Settings are an escape hatch, not a prerequisite.
3. **Total clarity.** Any setting we do expose explains, in plain language, what it
   changes about your learning and what the tradeoff is — no raw algorithm parameters
   presented without context.

## Approach

### Vocabulary data

Content is planned to come from the Anki **Kaishi 1.5k** deck, a widely-used starter
deck for Japanese learners, extracted into a structured dataset with fields for:

| Field | Example |
| --- | --- |
| Expression | 新しい |
| Reading | あたらしい |
| Meaning | new |
| Part of speech | i-adjective |
| Example sentence | 新しい本を買った。 |
| Audio | word and/or sentence audio |

> **TO CONFIRM — licensing and attribution.** The Kaishi 1.5k deck's license terms,
> redistribution rights, and attribution requirements have **not** been verified. They
> must be checked and credited before the dataset is bundled into any build that is
> distributed. Do not assume a permissive license. The same applies to any audio the
> deck ships, which may have separate rights from the text (see Open questions).

### Scheduling (SRS)

The scheduling engine is planned to be **FSRS** (Free Spaced Repetition Scheduler), a
modern, research-backed replacement for the SM-2 family of algorithms. The plan:

- Ship defaults tuned for Japanese beginners — a sensible desired retention, a modest
  new-cards-per-day rate, and a daily review cap that keeps the workload steady instead
  of spiky. Everyone gets a good pace with zero setup.
- Later, add a **minimal** settings screen exposing only the highest-impact parameters:
  - **Desired retention** — how often you want to recall a card correctly. Higher means
    more reviews per day; lower means fewer reviews but more forgetting.
  - **New cards/day** — how fast you take on new vocabulary. Raising it today raises
    your review load for weeks afterwards.
  - **Daily review cap** — the ceiling on how long a session can get. A cap keeps days
    predictable but pushes overdue cards further back.

  Each gets a plain-language note on what it does and its tradeoff. Raw FSRS weights
  are not exposed.

### Interface

A review flow that is faster and less cluttered than Anki on a phone: large, legible
cards; grading reachable with one thumb; minimal chrome; no modal settings in the
middle of a session.

## Tech stack

| Piece | Choice |
| --- | --- |
| Framework | [Expo](https://expo.dev) SDK 58.0.0 |
| Runtime | React Native 0.88, New Architecture (the SDK 58 default) |
| Language | TypeScript |
| Routing | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based) |
| Styling | React Native `StyleSheet` + design tokens — no styling libraries |
| Package manager | pnpm |

**On styling:** there is no NativeWind, Tailwind, styled-components, or other styling
library. Every design value — colors, spacing, radii, type sizes and weights — lives in
`constants/theme.ts` and is consumed through plain `StyleSheet.create` objects. This
keeps rendering consistent and predictable across dev, release, and web builds, with no
extra build step or runtime style engine to go wrong.

The palette is **Tailwind Zinc** for neutrals with a **Tailwind Rose** brand accent
(`#e11d48`, pressed `#be123c`). Light and dark palettes are selected from the OS
appearance via `useColorScheme`. The accent is defined in exactly one place, so
rebranding means editing three hex values.

## Project structure

```
doshi/
├── app/                    # Expo Router routes — every file here is a screen
│   ├── _layout.tsx         # Root layout: Stack, safe-area + gesture providers, status bar
│   └── index.tsx           # Landing screen (the only screen so far)
├── assets/
│   └── images/             # App icon, splash icon, favicon, Android adaptive icon
├── constants/
│   └── theme.ts            # The single source of truth for all design tokens
├── hooks/
│   └── use-theme.ts        # Resolves the active palette from the OS color scheme
├── app.json                # Expo app config (icons, splash, plugins, experiments)
├── eslint.config.js        # eslint-config-expo (flat config)
├── tsconfig.json           # Strict TypeScript, `@/*` path alias
├── .npmrc                  # node-linker=hoisted (required for pnpm + React Native)
├── .nvmrc                  # Node 22
└── pnpm-workspace.yaml     # pnpm build-script approvals
```

## Getting started

### Prerequisites

- **Node.js 22.13.0 or newer** — the minimum for Expo SDK 58. The repo pins a major
  version in [`.nvmrc`](.nvmrc), so `nvm use` picks it up, and `package.json` declares
  it under `engines`.
- **pnpm** (v10+).
- **Xcode 26.4 or newer** for iOS builds, with at least one iOS simulator installed.
- Android Studio if you want to build for Android.

### A note on `.npmrc`

pnpm's default symlinked `node_modules` layout breaks React Native's Metro bundler and
native module resolution, which both expect a flat tree. The repo therefore ships an
[`.npmrc`](.npmrc) containing:

```
node-linker=hoisted
```

This must be in place **before** you install dependencies. If you ever wipe
`node_modules`, keep this file.

`pnpm-workspace.yaml` separately allow-lists the one transitive dependency
(`unrs-resolver`, via `eslint-config-expo`) that needs to run a postinstall script;
pnpm blocks build scripts by default.

### Install and run

```bash
pnpm install          # install dependencies
pnpm start            # start the Expo dev server
```

Then pick a target, either from the dev server's interactive menu (`i` / `a` / `w`) or
directly:

```bash
pnpm ios              # open in the iOS Simulator
pnpm android          # open on an Android device/emulator
pnpm web              # open in a browser
```

Useful checks:

```bash
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint via expo lint
npx expo-doctor       # diagnose dependency and config issues
npx expo install --fix  # realign package versions with the SDK
```

Everything currently runs in **Expo Go** — no custom native code has been added, so no
development build is needed yet. That changes as soon as a native dependency (for
example `expo-sqlite`) lands.

> Running Expo's CLI through `npx` prints
> `npm warn Unknown project config "node-linker"`. It is harmless — npm doesn't
> recognise the pnpm-specific setting in `.npmrc`. Use `pnpm exec` instead of `npx` to
> avoid it.

## Roadmap

| Phase | Milestone | Status |
| --- | --- | --- |
| 0 | **Skeleton** — Expo + Router + TypeScript project, theme tokens, landing screen | ✅ Done |
| 1 | **Data pipeline + card model** — extract Kaishi 1.5k into a structured dataset, define the card/note schema and local storage | Not started |
| 2 | **FSRS review engine** — scheduling, grading, beginner-tuned defaults | Not started |
| 3 | **Review UI** — the fast mobile review loop | Not started |
| 4 | **Simple settings screen** — the three high-impact parameters, explained in plain language | Not started |
| 5 | **Accounts + sync** — multi-device progress | Not started |

## Open questions and caveats

- **Kaishi licensing and attribution** — unverified. Must be confirmed, and attribution
  added, before distributing any build containing the deck's content.
- **Audio source and rights** — whether the deck's audio can be redistributed, and
  whether to bundle audio files or generate/stream them, is undecided. Bundling affects
  app size significantly.
- **FSRS: library vs. port** — whether to depend on an existing FSRS implementation or
  port the algorithm. A dependency is faster and tracks upstream changes; a port avoids
  a dependency on a fast-moving library and keeps the scheduler fully inspectable. Not
  decided.
- **Storage** — local-first with `expo-sqlite` versus a backend as the source of truth.
  Local-first gives offline reviews and instant grading, but makes conflict resolution
  on sync harder. Leaning local-first, not decided.
- **Auth provider** — TBD, and only relevant from phase 5.
- **Feedback colors** — the Rose brand accent is close to a conventional "error" red.
  Review grades (especially *Again*) and destructive actions need their own semantic
  color, distinct from the brand accent, so that a failed recall doesn't read as the
  same signal as a primary action. The semantic palette is **TBD** and deliberately not
  defined in `constants/theme.ts` yet.

## Status

**Early — skeleton stage.** The project builds and runs cleanly on iOS with a single
landing screen. There is no SRS logic, no vocabulary data, no database, no auth, and no
backend yet.
