import {Component, Input} from '@angular/core';

/**
 * The export's data warnings (e.g. the benchmark has no results on some days), shown above a report's results so
 * nobody reads incomplete numbers as complete. Renders nothing when there are none.
 */
@Component({
  selector: 'app-data-warnings',
  templateUrl: './data-warnings.component.html',
  standalone: false
})
export class DataWarningsComponent {
  @Input() warnings: string[] | null | undefined = [];
}
