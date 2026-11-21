/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy} from '@angular/router';
import {TabHandleStore} from './tab-handle-store';

/**
 * Keeps each open tab's screen alive while another tab is shown.
 *
 * A "tab root" is the route rendered directly into the tab host's outlet
 * (HomeComponent, marked with `data: {tabHost: true}`), e.g. PmaComponent for
 * /home/pma/field. Every component route from the tab root down (PmaComponent
 * and FieldComponent) is detached and stored when the tab is hidden, and
 * re-attached when it is shown again, so filters, results and grid state
 * survive tab switches. All levels must be kept: Angular tears down a detached
 * route's children first, and any child not kept would be destroyed.
 * Routes outside the tab host behave as normal.
 */
@Injectable()
export class TabRouteReuseStrategy implements RouteReuseStrategy {

  constructor(private handles: TabHandleStore) {
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return isInTab(route) && this.handles.isOpen(tabUrl(route));
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (!isInTab(route)) {
      return;
    }
    if (handle) {
      this.handles.put(tabUrl(route), level(route), handle);
    } else {
      // Angular passes null right after re-attaching a stored screen: it is
      // visible again, so the store must no longer hold (or destroy) it.
      this.handles.forget(tabUrl(route), level(route));
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return isInTab(route) && this.handles.has(tabUrl(route), level(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return isInTab(route) ? this.handles.get(tabUrl(route), level(route)) : null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig !== curr.routeConfig) {
      return false;
    }
    // Two tabs of the same module (e.g. /home/pma/field and /home/pma/pmaexport)
    // share a tab root config; treat them as different screens so each tab
    // keeps its own subtree.
    if (isTabRoot(curr)) {
      return tabUrl(future) === tabUrl(curr);
    }
    return true;
  }
}

/** Component route at or below a tab root, i.e. part of a tab's screen. */
function isInTab(route: ActivatedRouteSnapshot): boolean {
  if (!hasComponent(route)) {
    return false;
  }
  for (let r: ActivatedRouteSnapshot | null = route; r; r = r.parent) {
    if (isTabRoot(r)) {
      return true;
    }
  }
  return false;
}

function hasComponent(route: ActivatedRouteSnapshot): boolean {
  return !!(route.routeConfig?.component || route.routeConfig?.loadComponent);
}

/** Depth of the route, so each level of a tab is stored separately. */
function level(route: ActivatedRouteSnapshot): number {
  return route.pathFromRoot.length;
}

/** Route that renders a component directly into the tab host's outlet. */
function isTabRoot(route: ActivatedRouteSnapshot): boolean {
  if (!route.routeConfig?.component && !route.routeConfig?.loadComponent) {
    return false;
  }
  let parent = route.parent;
  while (parent && !parent.routeConfig?.component && !parent.routeConfig?.loadComponent) {
    parent = parent.parent;
  }
  return !!parent?.routeConfig?.data?.['tabHost'];
}

/** Full URL of the screen shown by this route, including its child routes. */
export function tabUrl(route: ActivatedRouteSnapshot): string {
  const segments: string[] = [];
  for (const r of route.pathFromRoot) {
    segments.push(...r.url.map(s => s.path));
  }
  for (let child = route.firstChild; child; child = child.firstChild) {
    segments.push(...child.url.map(s => s.path));
  }
  return '/' + segments.filter(Boolean).join('/');
}
