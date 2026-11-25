/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../http.service';
import {ownErrorHandling} from '../api-error';

export interface AiPrompt {
  key: string;
  label: string;
  text: string;
}

export interface AiStatus {
  available: boolean;
  freeText: boolean;
  prompts: AiPrompt[];
}

/** The screen's selection, as the backend's tools read it; dates as yyyy-MM-dd */
export interface AiContext {
  accountId?: number;
  benchmarkId?: number;
  profileId?: number;
  startDate?: string;
  endDate?: string;
  /** Names from the total down to the selected row, for "explain the selected segment" */
  segmentPath?: string[];
}

export interface AiAnswer {
  /** ok | disabled | not_configured | refused | limit | error */
  status: string;
  message?: string;
  answer?: string;
  toolsUsed: string[];
  factsUsed: string[];
  unknownNumbers: string[];
  auditId?: string;
  generatedAt?: string;
}

/**
 * The AI assistant's API. The browser only talks to Minerva's backend: the provider, its key and the data policy
 * all live there.
 */
@Injectable({providedIn: 'root'})
export class AiService {

  constructor(private httpService: HttpService) {
  }

  status(screen: string): Observable<AiStatus> {
    return this.httpService.get('/api/ai/status', new HttpParams().set('screen', screen), ownErrorHandling());
  }

  ask(screen: string, context: AiContext, prompt: string | null, question: string | null = null): Observable<AiAnswer> {
    return this.httpService.post('/api/ai/ask', {screen, context, prompt, question}, ownErrorHandling());
  }
}
