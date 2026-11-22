/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild} from '@angular/core';
import {ModuleGroupVO} from '../admin/data/moduleGroupVO';
import {ModuleVO} from '../admin/data/moduleVO';

export interface NavSearchResult {
  module: ModuleVO;
  group: string;
}

export interface HighlightPart {
  text: string;
  match: boolean;
}

/**
 * Search field in the top header. Typing matches the menu items (the module groups
 * the user is permitted to see) by item or group name and lists them; choosing one
 * emits the module so the header opens it exactly as the menu does.
 * Ctrl/Cmd+K or "/" focuses it from anywhere.
 */
@Component({
  selector: 'app-nav-search',
  templateUrl: './nav-search.component.html',
  standalone: false
})
export class NavSearchComponent {

  static readonly MAX_RESULTS = 12;

  @Input() moduleGroups: ModuleGroupVO[] = [];
  @Output() selected = new EventEmitter<ModuleVO>();

  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement>;

  query = '';
  open = false;
  activeIndex = 0;
  results: NavSearchResult[] = [];

  readonly shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

  constructor(private host: ElementRef<HTMLElement>) {
  }

  onInput(value: string) {
    this.query = value;
    this.refresh();
  }

  onFocus() {
    this.refresh();
  }

  onKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.move(-1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.open && this.results[this.activeIndex]) {
          this.choose(this.results[this.activeIndex]);
        }
        break;
      case 'Escape':
        if (this.query) {
          this.onInput('');
        } else {
          this.input.nativeElement.blur();
        }
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  choose(result: NavSearchResult) {
    this.selected.emit(result.module);
    this.query = '';
    this.close();
    this.input.nativeElement.blur();
  }

  close() {
    this.open = false;
    this.activeIndex = 0;
  }

  /** Splits a label so the matched text can be highlighted without innerHTML. */
  highlight(label: string): HighlightPart[] {
    const q = this.query.trim().toLowerCase();
    const i = q ? label.toLowerCase().indexOf(q) : -1;
    if (i < 0) {
      return [{text: label, match: false}];
    }
    return [
      {text: label.slice(0, i), match: false},
      {text: label.slice(i, i + q.length), match: true},
      {text: label.slice(i + q.length), match: false}
    ].filter(p => p.text);
  }

  trackResult(_: number, r: NavSearchResult) {
    return r.group + '/' + r.module.name;
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent) {
    const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';
    const isSlash = event.key === '/' && !this.isTyping(event.target);
    if (isShortcut || isSlash) {
      event.preventDefault();
      this.input.nativeElement.focus();
      this.input.nativeElement.select();
    }
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent) {
    if (this.open && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** The list shows only while there is text to match. */
  private refresh() {
    const q = this.query.trim().toLowerCase();
    if (!q) {
      this.results = [];
      this.close();
      return;
    }
    const matches: NavSearchResult[] = [];
    for (const group of this.moduleGroups ?? []) {
      for (const module of group.modules ?? []) {
        if ((module.name + ' ' + group.name).toLowerCase().includes(q)) {
          matches.push({module, group: group.name});
        }
      }
    }
    // Items whose own name matches come first, earliest match first; group-only matches last.
    // Array.sort is stable, so ties keep menu order.
    matches.sort((a, b) => this.rank(a, q) - this.rank(b, q));
    this.results = matches.slice(0, NavSearchComponent.MAX_RESULTS);
    this.activeIndex = 0;
    this.open = true;
  }

  private rank(r: NavSearchResult, q: string): number {
    const i = r.module.name.toLowerCase().indexOf(q);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  }

  private move(delta: number) {
    if (!this.open || !this.results.length) {
      return;
    }
    this.activeIndex = (this.activeIndex + delta + this.results.length) % this.results.length;
  }

  private isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  }
}
