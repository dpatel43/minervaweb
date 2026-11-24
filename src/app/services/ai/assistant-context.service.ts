/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {TabService} from '../tabs/tab.service';
import {AiContext} from './ai.service';

/** What a screen shares with the assistant: its name (as the backend's prompt catalogue knows it) and selection */
export interface ScreenContext {
  screen: string;
  context: AiContext;
}

/**
 * What each open tab shares with the app-level assistant. A screen publishes when its data or selection changes
 * (Retrieve, a row click); the panel follows the active tab, so switching tabs switches what the assistant talks
 * about. A tab that published nothing (a screen that hasn't opted in) shares nothing, and closing a tab forgets it.
 */
@Injectable({providedIn: 'root'})
export class AssistantContextService {

  private readonly byTab = new BehaviorSubject<Map<string, ScreenContext>>(new Map());
  private activeUrl = '';

  /** The active tab's context; null when that screen shares nothing */
  readonly active$: Observable<ScreenContext | null>;

  constructor(private tabs: TabService) {
    this.tabs.activeUrl$.subscribe(url => this.activeUrl = url);
    // Forget closed tabs
    this.tabs.tabs$.subscribe(open => {
      const urls = new Set(open.map(t => t.url));
      const kept = new Map([...this.byTab.value].filter(([url]) => urls.has(url)));
      if (kept.size !== this.byTab.value.size) {
        this.byTab.next(kept);
      }
    });
    this.active$ = combineLatest([this.tabs.activeUrl$, this.byTab]).pipe(
      map(([url, all]) => all.get(url) ?? null),
      distinctUntilChanged());
  }

  /**
   * The URL of the tab a routed screen is on, as TabService keys tabs ("/home/pma/attribution"). Read it when the
   * screen is created: the active tab only changes after navigation ends, and a Retrieve can answer after the user
   * has moved to another tab.
   */
  static tabUrlOf(route: ActivatedRoute): string {
    const parts = route.snapshot.pathFromRoot.map(r => r.url.map(s => s.path).join('/')).filter(p => p);
    return '/' + parts.join('/');
  }

  /** Shares a screen's selection, for the tab it is on (its own: see tabUrlOf) */
  publish(screen: string, context: AiContext, tabUrl: string = this.activeUrl) {
    const next = new Map(this.byTab.value);
    next.set(tabUrl, {screen, context});
    this.byTab.next(next);
  }

  /** The screen has nothing to share any more (e.g. its form was cleared) */
  clear(tabUrl: string = this.activeUrl) {
    if (this.byTab.value.has(tabUrl)) {
      const next = new Map(this.byTab.value);
      next.delete(tabUrl);
      this.byTab.next(next);
    }
  }
}
