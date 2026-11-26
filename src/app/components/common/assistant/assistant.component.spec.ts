/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {AssistantComponent} from './assistant.component';
import {MineraCommonModule} from '../minera-common.module';
import {AiAnswer, AiService, AiStatus} from '../../../services/ai/ai.service';

describe('AssistantComponent', () => {
  let fixture: ComponentFixture<AssistantComponent>;
  let component: AssistantComponent;
  let ai: jasmine.SpyObj<AiService>;

  const status: AiStatus = {
    available: true, freeText: false,
    prompts: [{key: 'explain-view', label: 'Explain this view', text: 'Explain the performance.'},
      {key: 'explain-segment', label: 'Explain the selected segment', text: 'Explain the segment.'}]
  };
  const answer: AiAnswer = {
    status: 'ok', answer: 'Growth Equity trailed by 3.84 points.\n\nInformation Technology cost 3.49.',
    toolsUsed: ['get_attribution_summary'], factsUsed: ['Portfolio return 2.76, benchmark 6.59, excess -3.84.'],
    unknownNumbers: []
  };

  const create = (s: AiStatus) => {
    ai = jasmine.createSpyObj<AiService>('AiService', ['status', 'ask']);
    ai.status.and.returnValue(of(s));
    ai.ask.and.returnValue(of(answer));
    TestBed.configureTestingModule({imports: [MineraCommonModule], providers: [{provide: AiService, useValue: ai}]});
    fixture = TestBed.createComponent(AssistantComponent);
    component = fixture.componentInstance;
    component.screen = 'attribution';
    component.context = {accountId: 100010, benchmarkId: 100009, profileId: 3, startDate: '2025-11-20', endDate: '2026-11-20'};
    fixture.detectChanges();
  };

  const buttons = () => Array.from(fixture.nativeElement.querySelectorAll('button.assistant-prompt')) as HTMLButtonElement[];

  it('offers the screen\'s prompts and sends nothing until one is picked', () => {
    create(status);
    expect(ai.status).toHaveBeenCalledWith('attribution');
    expect(buttons().map(b => b.textContent.trim())).toEqual(['Explain this view', 'Explain the selected segment']);
    expect(ai.ask).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('asks with the selection as context and shows the answer and its facts', () => {
    create(status);
    buttons()[0].click();
    fixture.detectChanges();

    expect(ai.ask).toHaveBeenCalledWith('attribution', component.context, 'explain-view', null);
    const paragraphs = Array.from(fixture.nativeElement.querySelectorAll('.assistant-answer p')).map((p: HTMLElement) => p.textContent.trim());
    expect(paragraphs).toEqual(['Growth Equity trailed by 3.84 points.', 'Information Technology cost 3.49.']);
    expect(fixture.nativeElement.querySelector('.assistant-warning')).toBeNull();

    (fixture.nativeElement.querySelector('.assistant-footer button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.assistant-facts').textContent).toContain('excess -3.84');
  });

  it('warns about numbers that are not in the facts', () => {
    create(status);
    ai.ask.and.returnValue(of({...answer, unknownNumbers: ['4.08']}));
    buttons()[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.assistant-warning').textContent).toContain('4.08 is');
  });

  it('shows the answer with a warning when it was cut off', () => {
    create(status);
    ai.ask.and.returnValue(of({...answer, message: 'This answer was cut off at the length limit, so it may be incomplete.'}));
    buttons()[0].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Growth Equity trailed by 3.84 points.');
    expect(fixture.nativeElement.querySelector('.assistant-warning').textContent).toContain('cut off');
  });

  it('says so when the assistant is off, with no prompts', () => {
    create({available: false, freeText: false, prompts: []});
    expect(buttons().length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('AI commentary isn\'t configured.');
  });

  it('shows a question box only when typed questions are allowed', () => {
    create({...status, freeText: true});
    expect(fixture.nativeElement.querySelector('input[name=question]')).toBeTruthy();
    component.question = '  Why did IT detract?  ';
    component.askTyped();
    expect(ai.ask).toHaveBeenCalledWith('attribution', component.context, null, 'Why did IT detract?');
  });

  it('loads the new screen\'s prompts when the active screen changes', () => {
    create(status);
    buttons()[0].click();
    ai.status.and.returnValue(of({available: true, freeText: false, prompts: [{key: 'explain-returns', label: 'Explain these returns', text: ''}]}));
    component.screen = 'summary';
    component.ngOnChanges({screen: {currentValue: 'summary', previousValue: 'attribution', firstChange: false, isFirstChange: () => false}});
    fixture.detectChanges();
    expect(ai.status).toHaveBeenCalledWith('summary');
    expect(buttons().map(b => b.textContent.trim())).toEqual(['Explain these returns']);
    expect(component.result).toBeNull();
  });

  it('says when a screen has no suggested questions', () => {
    create({available: true, freeText: false, prompts: []});
    expect(fixture.nativeElement.textContent).toContain('There are no suggested questions for this screen yet.');
  });

  it('clears the answer when the selection changes', () => {
    create(status);
    buttons()[0].click();
    expect(component.result).toBeTruthy();
    component.ngOnChanges({context: {currentValue: {}, previousValue: {}, firstChange: false, isFirstChange: () => false}});
    expect(component.result).toBeNull();
  });
});
