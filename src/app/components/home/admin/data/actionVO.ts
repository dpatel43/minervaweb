export class ActionVO {
  id: number;
  parentActionId: number;
  name = '';
  alias =  '';
  sequenceNumber: number;
  menuAccess: boolean;
  actionFile = '';
  children: ActionVO[];
}
