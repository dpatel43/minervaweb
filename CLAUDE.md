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

Known broken scripts: `npm run lint` (no `lint` target in `angular.json`; `tslint.json` is legacy) and `npm run e2e` (Protractor config in `e2e/` but Protractor isn't installed). `npm run devstart` references `proxyconfigdev.json`, which doesn't exist.

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

## Build/deploy

`Dockerfile` does a multi-stage build (node 22 → nginx:alpine). `Jenkinsfile` builds the image and pushes it to Docker Hub as `dharmesh12/minervaweb:<build#>` and `:latest`.
