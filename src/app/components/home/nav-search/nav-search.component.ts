/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, ElementRef, EventEmitter, HostListener, Output, ViewChild} from '@angular/core';

/**
 * Search field in the top header. What it searches is not decided yet: for now it
 * only emits the text on Enter (nothing listens yet). Ctrl/Cmd+K or "/" focuses it.
 */
@Component({
  selector: 'app-nav-search',
  templateUrl: './nav-search.component.html',
  standalone: false
})
export class NavSearchComponent {

  @Output() search = new EventEmitter<string>();

  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement>;

  query = '';

  readonly shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';

  submit() {
    const q = this.query.trim();
    if (q) {
      this.search.emit(q);
    }
  }

  clear() {
    this.query = '';
    this.input.nativeElement.blur();
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

  private isTyping(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
  }
}
