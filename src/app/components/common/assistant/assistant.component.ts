/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Subscription} from 'rxjs';
import {AiAnswer, AiContext, AiPrompt, AiService} from '../../../services/ai/ai.service';

/**
 * The AI assistant's content: the screen's suggested prompts, the answer and the facts behind it. The app-level side
 * panel (HomeComponent) hosts it with the active tab's screen and selection. Nothing is sent until the user picks a
 * prompt, and the selection travels as ids and dates for the backend's tools, never inside the question.
 */
@Component({
  selector: 'app-assistant',
  templateUrl: './assistant.component.html',
  styleUrl: './assistant.component.css',
  standalone: false
})
export class AssistantComponent implements OnInit, OnChanges, OnDestroy {
  /** Screen name the backend knows, e.g. "dashboard", "attribution" */
  @Input() screen = '';
  @Input() context: AiContext = {};

  /** null until the status has loaded */
  available: boolean | null = null;
  freeText = false;
  prompts: AiPrompt[] = [];
  question = '';

  asking = false;
  /** The prompt or question being answered */
  askedLabel = '';
  result: AiAnswer | null = null;
  showFacts = false;

  private request?: Subscription;

  constructor(private ai: AiService) {
  }

  private statusRequest?: Subscription;

  ngOnInit(): void {
    this.loadStatus();
  }

  /** Another screen brings its own prompts; a new selection makes the shown answer stale */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['screen'] && !changes['screen'].firstChange) {
      this.loadStatus();
    }
    if ((changes['context'] && !changes['context'].firstChange) || (changes['screen'] && !changes['screen'].firstChange)) {
      this.clear();
    }
  }

  private loadStatus() {
    this.statusRequest?.unsubscribe();
    this.available = null;
    this.prompts = [];
    this.statusRequest = this.ai.status(this.screen).subscribe({
      next: s => {
        this.available = s.available;
        this.freeText = s.freeText;
        this.prompts = s.prompts ?? [];
      },
      error: () => this.available = false
    });
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
    this.statusRequest?.unsubscribe();
  }

  get paragraphs(): string[] {
    return (this.result?.answer ?? '').split(/\n\s*\n|\n/).map(p => p.trim()).filter(p => p);
  }

  ask(prompt: AiPrompt) {
    this.send(prompt.label, prompt.key, null);
  }

  askTyped() {
    const q = this.question.trim();
    if (q) {
      this.send(q, null, q);
    }
  }

  clear() {
    this.request?.unsubscribe();
    this.asking = false;
    this.result = null;
    this.askedLabel = '';
    this.showFacts = false;
  }

  private send(label: string, prompt: string | null, question: string | null) {
    if (this.asking) {
      return;
    }
    this.asking = true;
    this.askedLabel = label;
    this.result = null;
    this.showFacts = false;
    this.request = this.ai.ask(this.screen, this.context, prompt, question).subscribe({
      next: r => {
        this.result = r;
        this.asking = false;
      },
      error: () => {
        this.result = {status: 'error', message: 'The AI assistant couldn\'t answer. Please try again.', toolsUsed: [], factsUsed: [], unknownNumbers: []};
        this.asking = false;
      }
    });
  }
}
