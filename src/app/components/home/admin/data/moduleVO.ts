import { ActionVO } from './actionVO';

export class ModuleVO {
  id: number;
  name: '';
  sequenceNumber: number;
  homeURL = '';
  actions: ActionVO[];
}
