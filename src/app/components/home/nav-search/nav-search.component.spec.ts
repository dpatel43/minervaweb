/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NavSearchComponent} from './nav-search.component';
import {ModuleGroupVO} from '../admin/data/moduleGroupVO';
import {ModuleVO} from '../admin/data/moduleVO';

function module(name: string, homeURL: string): ModuleVO {
  return Object.assign(new ModuleVO(), {name, homeURL});
}

function group(name: string, modules: ModuleVO[]): ModuleGroupVO {
  return Object.assign(new ModuleGroupVO(), {name, modules});
}

describe('NavSearchComponent', () => {
  let fixture: ComponentFixture<NavSearchComponent>;
  let component: NavSearchComponent;
  let el: HTMLElement;

  const fields = module('Fields', 'pma/field');
  const profiles = module('Profiles', 'pma/profile');
  const pmaExport = module('PMA Export', 'pma/pmaexport');
  const users = module('Staff Users', 'admin/staffuser');

  function type(text: string) {
    const input = el.querySelector('input') as HTMLInputElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function names(): string[] {
    return Array.from(el.querySelectorAll('.nav-search-name')).map(n => n.textContent.trim());
  }

  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [NavSearchComponent]});
    fixture = TestBed.createComponent(NavSearchComponent);
    component = fixture.componentInstance;
    component.moduleGroups = [
      group('PMA', [fields, profiles, pmaExport]),
      group('Admin', [users])
    ];
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('shows no list until something is typed', () => {
    (el.querySelector('input') as HTMLInputElement).dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(el.querySelector('.nav-search-panel')).toBeNull();
  });

  it('matches menu items by name, case-insensitively', () => {
    type('PRO');
    expect(names()).toEqual(['Profiles']);
  });

  it('matches by group name, listing items whose own name matches first', () => {
    type('pma');
    expect(names()).toEqual(['PMA Export', 'Fields', 'Profiles']);
  });

  it('says so when nothing matches', () => {
    type('zzz');
    expect(el.querySelector('.nav-search-empty').textContent).toContain('zzz');
  });

  it('emits the clicked menu item and clears the field', () => {
    const chosen: ModuleVO[] = [];
    component.selected.subscribe(m => chosen.push(m));
    type('staff');
    (el.querySelector('.nav-search-option') as HTMLElement).click();
    fixture.detectChanges();
    expect(chosen).toEqual([users]);
    expect(component.query).toBe('');
    expect(el.querySelector('.nav-search-panel')).toBeNull();
  });

  it('moves with the arrow keys and opens the highlighted item on Enter', () => {
    const chosen: ModuleVO[] = [];
    component.selected.subscribe(m => chosen.push(m));
    type('pma');
    const input = el.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'ArrowDown'}));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    expect(chosen).toEqual([fields]);
  });
});
