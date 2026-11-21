# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Minervaweb is an Angular 20 single-page front end (NgModule-based, not standalone) for the "Minerva" backend API (`/minervaapi`). It uses Angular Material + Bootstrap 5 for UI, NgRx for state in some feature modules, and AG Grid (community, modular packages) for some grids.

## Commands

- `npm start` — dev server on `0.0.0.0:4200` (opens browser)
- `npm run build` — production AOT build to `dist/minervaweb`
- `npm test` — Karma + Jasmine unit tests (Chrome launcher)
  - Single run / headless: `npx ng test --watch=false --browsers=ChromeHeadless`
  - Single spec file: `npx ng test --include src/app/path/to/file.spec.ts`
- `npm run dockerbuild` / `npm run rundocker` — build and run the nginx image (serves on 8080, `apiServer` env var points at the API)

Known broken scripts: `npm test` (`karma.conf.js` requires `karma-coverage-istanbul-reporter`, which isn't installed; `karma-coverage` is), `npm run lint` (no `lint` target in `angular.json`; `tslint.json` is legacy) and `npm run e2e` (Protractor config in `e2e/` but Protractor isn't installed). `npm run devstart` references `proxyconfigdev.json`, which doesn't exist.

## Runtime API configuration

The API base URL comes from `window.__env.apiServer`, loaded by `<script src="assets/env.js">` in `src/index.html`. `HttpService` (`src/app/services/http.service.ts`) uses it, falling back to `environment.apiServer` if `window.__env` is absent.

- `src/assets/env.js` is not committed, but `angular.json` lists it as an asset. For local dev, copy `src/assets/env.template.js` to `src/assets/env.js` (default `http://localhost:8081/minervaapi`).
- In Docker, `docker-entrypoint.sh` writes `env.js` at container start from the `apiServer` env var. The same image works in any environment because of this, so don't bake API URLs into the build.

## Architecture

**Routing** uses hash routing (`useHash: true`) and `APP_BASE_HREF` `/minervaweb`. Feature modules are lazy-loaded:
`app-routing` → `login`, `home` → `home-routing` → `admin`, `accountmgmt`, `pma`. Each feature has its own `*-routing.module.ts` and `*.module.ts` under `src/app/components/home/<feature>/`.

**Feature module layout** (see `pma/`, `admin/`): `components/`, `data/` (DTO/VO classes that mirror API payloads, e.g. `Page<T>` in `src/app/models/page.ts` for Spring-style paged results), `services/`, and for NgRx features, `store/{actions,effects,reducers,selectors,states}`.

**HTTP layer**: feature services go through `HttpService` (never `HttpClient` directly), which prefixes the API server and sets JSON headers. Endpoints are under `/api/...` (e.g. `/api/pma/field/...`). Convention in services like `FieldService.saveField`: `PUT` creates a new entity (id `0`) and `POST` updates an existing one.

**Auth**: `AuthenticationService` posts to `/login` and stores the response in `localStorage` (`loginResponse`, `loggedIn`). `JwtInterceptor` sends the raw token in the `Authorization` header (no `Bearer` prefix). `AuthGuard` sends users to `/login` or `/home`.

**Shared UI**: `MineraCommonModule` (`src/app/components/common/minera-common.module.ts`, note the spelling) re-exports the Material/Forms modules and `MinervaTableComponent`. Feature modules import it instead of importing Material modules one by one. `MinervaTableComponent` + `MinervaDataSource` provide a server-side paginated/sorted `mat-table` driven by a `loadFunction(sort, paginator)` returning `Observable<Page<T>>`. `CacheService` backs the autocomplete/select lookup components (`/api/cache`, `/api/codecache`).

**List/detail pattern**: entity screens are split into a container (`x.component`), `x-list.component` and `x-detail.component`, and toggle between list and detail mode. Some use the `AbstractEntityComponent`/`AbstractEntityDetailComponent` base classes in `components/common/`. PMA `field` uses NgRx instead: class-based actions (`new RetrieveFieldsAction(...)`), `createEffect` effects calling the service, and a `detail` flag in the feature state (`StoreModule.forFeature('field', ...)`).

**AG Grid**: uses the modular `@ag-grid-community/*` v32 packages. `ClientSideRowModelModule` is registered globally in `app.module.ts`, and `AgGridAngular` is imported per feature module.

Components are declared with `standalone: false`. Keep new components in NgModules to match.

## Styling conventions

The app is being migrated gradually to a Bootstrap-first look. Global theming lives in `src/styles.css`:

- All text and numbers are **11px** (`--app-font-size`). The root `html` font size is 11px, so Bootstrap's rem-based sizes and spacing scale from it. Don't add per-component font sizes; Bootstrap `small`/`-sm` variants are pinned to 11px too.
- Colors and other values are CSS variables on `:root` (`--app-navy`, `--app-border`, `--app-header-bg`, ...). Bootstrap (`--bs-*`), Angular Material (`--mat-*`) and AG Grid (`--ag-*`) tokens all map to them, so change the tokens rather than individual components.
- For new or migrated screens, prefer Bootstrap markup (`card`, `form-label` + `form-control`, `btn btn-primary`, `table table-sm`) over Material components. Material is still used for the datepicker, autocomplete, and `mat-table`/paginator, which are restyled globally to match.
- Use `.num` for right-aligned, tabular-figure numeric cells (or `type: 'numericColumn'` / `cellClass: 'num'` in AG Grid), and `.positive`/`.negative` for gains and losses. Use `.page-header` for a screen title row.
- Report screens (see `pmaexport`, `pma-history`) use `.report-page` > `.page-header` + `form.card.filter-bar` (a `row g-2 align-items-end` of `col-auto filter-field` columns) + `.card.results-card`, where the results table fills the remaining height and scrolls with a sticky header. Datepickers use a Bootstrap `input-group date-input` with a bare `mat-datepicker-toggle`, and tree tables use `.tree-cell`/`.tree-toggle` with Bootstrap Icons chevrons.
- Resizable `mat-table` columns: add `grid-lines resizable-table` to the table, a `<colgroup>` bound to a widths map, and `[appColumnResize]="widths" columnKey="..."` on each header cell (`ColumnResizeDirective` in `components/common/`, exported by `MineraCommonModule`). `pma-history` is the reference; it saves widths to `localStorage`.
- Tree tables (`MatTreeFlatDataSource`) sort and filter by rebuilding the nested tree with `filterTree`/`sortTree`/`compareValues` from `components/common/tree-table.utils.ts`. Keep the API tree as the source, re-set `dataSource.data` on every change, then re-expand nodes except the ones the user collapsed. Rows sort among siblings, and the filter keeps ancestors of matches. `pmaexport` and `pma-history` show the pattern.
- Paged AG Grid lists: put `appFitGridHeight` on `ag-grid-angular` (`FitGridHeightDirective` in `components/common/`) inside a `.results-card.fit-content`. The grid sizes to the rows on the current page so the paging bar sits under the last row, and shrinks and scrolls when the page is too short. Don't use Bootstrap's `flex-fill` on the grid, because its `!important` overrides the directive.
- The shared `app-minerva-auto-complete` and `app-minerva-cache-select` render Bootstrap controls. Pass `inputId` so a `<label for>` targets the inner input.

## Build/deploy

`Dockerfile` does a multi-stage build (node 22 → nginx:alpine). `Jenkinsfile` builds the image and pushes it to Docker Hub as `dharmesh12/minervaweb:<build#>` and `:latest`.
