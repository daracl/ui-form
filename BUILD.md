# Build configuration review

Reviewed on 2026-10-29. The corejs configuration was used as a reference; these changes apply to ui-form. No sibling repository or local dependency path is required.

## Changes

- Use ESM Vite configuration and Sass's modern API instead of the deprecated CJS/legacy APIs.
- Upgrade to Vite 7.3.7, Rollup 4.66.0, Sass 1.107.0, esbuild 0.28.2 and TypeScript 5.9.3. Keep Vite 5's browser compilation targets explicitly.
- Remove unused Webpack, TSLint, Jest, cpx, old documentation themes and their dependency trees. The public JavaScript source contains no JSX/Preact usage.
- Use one Vite API process for four bundle builds. Emit declarations in a parallel process, clean once, copy once and skip gzip-size reporting.
- Keep source maps, all ES/CJS/UMD variants, bundled UMD dependencies, CSS and source declaration files. CSS imports remain bundled in ES/CJS too.
- Restrict development and preview hosts to loopback; keep host/CORS validation and strict filesystem boundaries. GitHub Actions uses read-only repository permissions.
- Update compatible transitive patches and override toast's old esbuild build dependency. This override is repository-local and is not inherited by consumers of the published package.

## Measurements

Same Windows checkout, Node 24.20.0, one full build per configuration. Wall time includes npm startup and final file operations; this is not a multi-run benchmark.

| Check | Before | After |
| --- | --- | --- |
| Full build | 51.89 s | 15.92 s |
| npm audit findings (including dev) | 42 (2 critical, 16 high) | 0 |
| Vite CJS / Sass legacy warnings | Present | Absent |

The initial measured build improvement is approximately 69%. A later full verification recorded 31.36 s inside the build script (excluding npm startup), so timings vary substantially with system load and cache state. The figures above are single-run observations, not a guaranteed speedup. Audit results describe the registry advisories available at verification time, not a guarantee that every dependency is free of defects.

## Verification

Run `npm ci`, `npm run verify`, and `npm run audit:security:all` after cloning or changing dependencies. Verification includes utility/layout regressions, live dev-server host/CORS/filesystem checks and package smoke tests for ES/CJS/UMD exports, styles, declarations and source maps.

The initial build-configuration verification passed 11 tests and preserved all 57 baseline artifact paths. `npm run docs:gen` also succeeded, with 9 documentation warnings about referenced types not included as documentation entry points. Those are separate from the removed Vite/Sass API deprecations.

References: [Vite CJS migration](https://v5.vite.dev/guide/migration#deprecate-cjs-node-api), [Sass modern API](https://sass-lang.com/documentation/breaking-changes/legacy-js-api/), [Vite server options](https://vite.dev/config/server-options).

## Form runtime regression follow-up

The core 0.0.9 merge turns sparse array holes into explicit undefined values. Normalize only field/children lists after merging and at dynamic field entry points; ordinary option arrays remain unchanged. Missing hidden-field checks are also null-safe.

Browser regressions additionally found and fixed dynamic group normalization, stale DOM/values after setFields, numeric checkbox options, grid zero/false values, date callbacks, instance registration cleanup/lookup and tab reset.

Final local verification: TypeScript, 15 Node tests, complete build/package smoke tests and 20 headless Edge 156 browser tests passed. Browser coverage includes all six examples, interactive form APIs and both minified/unminified ES and UMD bundles. GitHub Actions installs Chromium and runs the same browser suite after building; the CI run itself has not been executed locally.
