/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {BehaviorSubject} from 'rxjs';
import {AssistantContextService, ScreenContext} from './assistant-context.service';
import {AppTab, TabService} from '../tabs/tab.service';

describe('AssistantContextService', () => {
  let activeUrl: BehaviorSubject<string>;
  let tabs: BehaviorSubject<AppTab[]>;
  let service: AssistantContextService;
  let active: ScreenContext | null;

  const tab = (url: string): AppTab => ({url, title: url, closable: url !== '/home'});

  beforeEach(() => {
    activeUrl = new BehaviorSubject('/home');
    tabs = new BehaviorSubject([tab('/home'), tab('/home/pma/dashboard'), tab('/home/pma/attribution')]);
    service = new AssistantContextService({activeUrl$: activeUrl, tabs$: tabs} as unknown as TabService);
    service.active$.subscribe(c => active = c);
  });

  it('follows the active tab, and a tab that shared nothing has no context', () => {
    service.publish('dashboard', {accountId: 100010}, '/home/pma/dashboard');
    service.publish('attribution', {accountId: 100010, segmentPath: ['Total']}, '/home/pma/attribution');
    expect(active).toBeNull();

    activeUrl.next('/home/pma/dashboard');
    expect(active).toEqual({screen: 'dashboard', context: {accountId: 100010}});
    activeUrl.next('/home/pma/attribution');
    expect(active.screen).toBe('attribution');
  });

  it('keeps a slow screen\'s data on its own tab when the user has moved on', () => {
    activeUrl.next('/home/pma/attribution');
    // the dashboard's Retrieve answers while the attribution tab is active
    service.publish('dashboard', {accountId: 100010}, '/home/pma/dashboard');
    expect(active).toBeNull();
    activeUrl.next('/home/pma/dashboard');
    expect(active.screen).toBe('dashboard');
  });

  it('forgets a closed tab, and clears on request', () => {
    service.publish('dashboard', {accountId: 100010}, '/home/pma/dashboard');
    activeUrl.next('/home/pma/dashboard');
    tabs.next([tab('/home'), tab('/home/pma/attribution')]);
    expect(active).toBeNull();

    service.publish('attribution', {}, '/home/pma/attribution');
    activeUrl.next('/home/pma/attribution');
    service.clear('/home/pma/attribution');
    expect(active).toBeNull();
  });

  it('works out a routed screen\'s tab URL from its route', () => {
    const route = {snapshot: {pathFromRoot: [{url: []}, {url: [{path: 'home'}]}, {url: [{path: 'pma'}]}, {url: [{path: 'attribution'}]}]}};
    expect(AssistantContextService.tabUrlOf(route as any)).toBe('/home/pma/attribution');
  });
});
