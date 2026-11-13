# AGENTS.md

Project instructions for AI coding agents. Shared baseline rules (git flow,
testing, architecture, safety) come from the user-level `AGENTS.md`; this file
adds project-specific detail and wins on conflict.

## What this is

Two independent Angular 21 applications deployed from one repository, sharing a
single Firebase project:

- `dashboard/` — the private admin surface: login, availability management, and
  the home overview. Reads and writes Firestore directly and is guarded by the
  `whitelist` collection.
- `portfolio/` — the public site: marketing home and the booking flow. Writes
  bookings to Firestore and notifies Telegram through one Vercel function.

There is no monorepo tool and no shared workspace package: each app builds and
deploys on its own (`dashboard/vercel.json`, `portfolio/vercel.json`). What the
two genuinely share lives at the repository root and is wired in through
tsconfig path aliases:

- `firebase.config.ts` → imported as `shared/firebase.config`
- `primeng.config.ts` → imported as `shared/primeng.config`

## Commands

From the repository root:

```bash
npm start          # dashboard on :4201 + portfolio on :4200, hot reload
npm run lint       # ESLint --fix in both apps
npm run format     # Prettier --write in both apps
npm run clean-code # format, then lint
```

Per app, from `dashboard/` or `portfolio/`: `npm start`, `npm run build`,
`npm run lint`, `npm run format`. There is no test runner configured yet — see
Testing below.

## Architecture

### Frontend

Both apps follow the same shape:

```
src/app/
├── app.config.ts      providers: Firebase, PrimeNG preset, router
├── app.routes.ts      top-level routes
├── pages/<page>/      one folder per routed page, owning its components
└── shared/
    ├── models/        types only, no functions
    ├── services/      Firestore access, grouped by concern (auth, bookings,
    │                  dates, assets, whitelist) plus database.ts
    ├── utils/         pure helpers
    └── guards/        route guards (dashboard only)
```

Services are the only layer that touches Firestore: a page component injects a
service and renders, it never imports the Firebase SDK directly. Components are
standalone (no NgModules) and use Angular signals for local state.

**Duplication between the two apps is real and deliberate.** `auth`, `bookings`,
`dates`, `assets` and `database` exist in both `shared/services/` trees with the
same concerns, because the apps deploy independently and there is no shared
package. When you change one of those services, check the sibling app and keep
the behaviour aligned — or extract the shared part to the repository root the way
`firebase.config.ts` is extracted. Do not add a third copy.

### Firebase and security

`firestore.rules` is the security boundary, not a formality. Admin rights are not
a custom claim: they are a signed-in uid listed in `whitelist/whitelistIds`,
resolved inside the rules with `exists()`/`get()`. Any new collection, field, or
query pattern needs a matching rule change and a check against the emulator
before it ships.

`portfolio/api/notify-telegram.ts` is a Vercel serverless function that keeps the
Telegram bot token server-side. Never move that call into the browser, and never
commit the token.

## Testing

Neither app has a test runner today. The baseline requires tests for new
behaviour, so adding the runner is part of the first feature that needs one:
Vitest through the Angular unit-test builder, with `ng-mocks` for component
isolation and `@faker-js/faker` for fixtures — the same stack as `aurum-fe`.
Until that exists, verify a change by building both apps and exercising the
affected flow by hand.

## Conventions

- PrimeNG first: use a PrimeNG component before writing custom markup or CSS.
  Build a custom component only when PrimeNG has no equivalent.
- Tailwind for layout and spacing, PrimeNG tokens for colour and theming. Never
  hardcode a hex value that already exists as a token.
- One component per file; prop and view types in their own `*.model.ts` file.
  Services return typed observables or signals — never `any`.
- Unsubscribe explicitly: `takeUntilDestroyed(this.destroyRef)` on every
  component subscription, `toObservable()` + `switchMap()` +
  `takeUntilDestroyed()` for signal-driven chains.
- Firebase configuration comes from `firebase.config.ts`; never inline a key in
  a component or a service.

## Deployment

- `dashboard` and `portfolio` deploy to Vercel from their own `vercel.json`.
- Firestore rules deploy through
  `.github/workflows/deploy-firestore-rules.yml`.
- No CI builds or lints either app: run `npm run clean-code` and a production
  build before opening a PR.
