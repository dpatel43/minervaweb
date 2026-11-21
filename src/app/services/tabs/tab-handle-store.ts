/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {DetachedRouteHandle} from '@angular/router';

/**
 * Holds the detached (hidden) screens of open tabs, keyed by tab URL.
 *
 * Kept separate from TabService on purpose: the route reuse strategy needs it,
 * and the strategy is created while the Router is being built, so it cannot
 * depend on anything that injects the Router.
 */
@Injectable({providedIn: 'root'})
export class TabHandleStore {
  private readonly openUrls = new Set<string>();
  /** Keyed by "<tab url>@<route depth>": one entry per level of a tab's route tree */
  private readonly handles = new Map<string, DetachedRouteHandle>();

  setOpenUrls(urls: string[]) {
    this.openUrls.clear();
    urls.forEach(u => this.openUrls.add(u));
  }

  isOpen(url: string): boolean {
    return this.openUrls.has(url);
  }

  has(url: string, level: number): boolean {
    return this.handles.has(key(url, level));
  }

  get(url: string, level: number): DetachedRouteHandle | null {
    return this.handles.get(key(url, level)) ?? null;
  }

  put(url: string, level: number, handle: DetachedRouteHandle) {
    const k = key(url, level);
    const existing = this.handles.get(k);
    // A re-detached screen comes back with a new handle object around the same
    // component; only destroy the old one if it really is a different screen.
    if (existing && componentRef(existing) !== componentRef(handle)) {
      componentRef(existing)?.destroy();
    }
    this.handles.set(k, handle);
  }

  /** Drops a handle without destroying it (its screen is back on the page). */
  forget(url: string, level: number) {
    this.handles.delete(key(url, level));
  }

  /** Destroys every hidden level of a closed tab's screen. */
  destroy(url: string) {
    const prefix = url + '@';
    for (const k of [...this.handles.keys()]) {
      if (k.startsWith(prefix)) {
        componentRef(this.handles.get(k))?.destroy();
        this.handles.delete(k);
      }
    }
  }

  destroyAll() {
    for (const handle of this.handles.values()) {
      componentRef(handle)?.destroy();
    }
    this.handles.clear();
  }
}

function key(url: string, level: number): string {
  return `${url}@${level}`;
}

/** DetachedRouteHandle is opaque; Angular stores the screen's ComponentRef on it. */
function componentRef(handle: DetachedRouteHandle | undefined): { destroy(): void } | undefined {
  return (handle as any)?.componentRef;
}
