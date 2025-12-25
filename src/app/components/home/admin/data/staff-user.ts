import {UserVO} from "./user-vo";
import {CacheResult} from "../../../../models/cache-result";

export class StaffUser {

  staffUserId: number = 0;
  firstName = '';
  middleName = '';
  lastName = '';
  aclGroup: CacheResult<number> = new CacheResult();
  user: UserVO = new UserVO();
}
