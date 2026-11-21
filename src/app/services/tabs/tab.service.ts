/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {TabHandleStore} from './tab-handle-store';

export interface AppTab {
  url: string;
  title: string;
  closable: boolean;
}

export const MAIN_TAB_URL = '/home';

const mainTab = (): AppTab => ({url: MAIN_TAB_URL, title: 'Main', closable: false});

/**
 * Tabs of the main content panel. The Main tab is always present; each menu
 * item opens (or switches to) a closable tab for its screen.
 */
@Injectable({providedIn: 'root'})
export class TabService {
  private readonly tabsSubject = new BehaviorSubject<AppTab[]>([mainTab()]);
  private readonly activeUrlSubject = new BehaviorSubject<string>(MAIN_TAB_URL);
  /** Titles from the menu, used for tabs opened by URL (refresh, bookmark) */
  private knownTitles = new Map<string, string>();

  readonly tabs$ = this.tabsSubject.asObservable();
  readonly activeUrl$ = this.activeUrlSubject.asObservable();

  constructor(private router: Router, private store: TabHandleStore) {
    this.syncStore();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      const url = normalize(e.urlAfterRedirects);
      // A screen reached without the menu (refresh, bookmark, link) still gets a tab
      if (url.startsWith(MAIN_TAB_URL + '/') && !this.find(url)) {
        this.add({url, title: this.knownTitles.get(url) ?? titleFromUrl(url), closable: true});
      }
      this.activeUrlSubject.next(url);
    });
  }

  get tabs(): AppTab[] {
    return this.tabsSubject.value;
  }

  /** Opens a tab for the screen, or switches to it if it is already open. */
  open(url: string, title: string) {
    url = normalize(url);
    const isNew = !this.find(url);
    if (isNew) {
      this.add({url, title, closable: true});
    }
    // Don't leave a dead tab behind if the screen can't be shown
    const dropIfNew = (reason: unknown) => {
      if (isNew) {
        this.remove(url);
      }
      console.error(`Could not open tab ${url}`, reason ?? '');
    };
    this.router.navigateByUrl(url).then(ok => ok || dropIfNew('navigation was cancelled'), dropIfNew);
  }

  activate(tab: AppTab) {
    this.router.navigateByUrl(tab.url);
  }

  close(tab: AppTab) {
    if (!tab.closable) {
      return;
    }
    const index = this.tabs.findIndex(t => t.url === tab.url);
    if (index < 0) {
      return;
    }
    const wasActive = this.activeUrlSubject.value === tab.url;
    const remaining = this.tabs.filter(t => t.url !== tab.url);
    this.tabsSubject.next(remaining);
    this.syncStore();

    if (wasActive) {
      // Navigating away destroys the screen (its tab is no longer open)
      const next = remaining[Math.min(index, remaining.length - 1)];
      this.router.navigateByUrl(next.url);
    } else {
      this.store.destroy(tab.url);
    }
  }

  /** Remembers menu titles and renames tabs that were opened before the menu loaded. */
  setKnownTitles(titles: Map<string, string>) {
    this.knownTitles = new Map([...titles].map(([url, title]) => [normalize(url), title]));
    let changed = false;
    const tabs = this.tabs.map(t => {
      const title = this.knownTitles.get(t.url);
      if (t.closable && title && title !== t.title) {
        changed = true;
        return {...t, title};
      }
      return t;
    });
    if (changed) {
      this.tabsSubject.next(tabs);
    }
  }

  /** Closes every tab and discards their screens (e.g. on logout). */
  reset() {
    this.tabsSubject.next([mainTab()]);
    this.syncStore();
    this.store.destroyAll();
    this.activeUrlSubject.next(MAIN_TAB_URL);
  }

  private remove(url: string) {
    this.tabsSubject.next(this.tabs.filter(t => t.url !== url));
    this.syncStore();
  }

  private add(tab: AppTab) {
    this.tabsSubject.next([...this.tabs, tab]);
    this.syncStore();
  }

  private find(url: string): AppTab | undefined {
    return this.tabs.find(t => t.url === url);
  }

  private syncStore() {
    this.store.setOpenUrls(this.tabs.filter(t => t.closable).map(t => t.url));
  }
}

/** Path only, with a leading slash: "/home/pma/field" */
function normalize(url: string): string {
  const path = (url ?? '').split(/[?#]/)[0];
  return path.startsWith('/') ? path : '/' + path;
}

/** "/home/pma/pma-history" -> "Pma History" (until the menu supplies the real title) */
function titleFromUrl(url: string): string {
  const last = url.split('/').filter(Boolean).pop() ?? '';
  return last.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
