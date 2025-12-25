import { ModuleVO } from './moduleVO';
export class ModuleGroupVO {
  id: number;
  name: '';
  sequenceNumber: number;
  alias = '';
  description = '';
  parentGroupID: number;

  modules: ModuleVO[] = [];
  parentModuleGroup: ModuleGroupVO;
}
