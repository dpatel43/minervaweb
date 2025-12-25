export class UserVO {
  userId:number;
  firstName: string;
  lastName: string;
  profilePictureUrl:string;
  username: string;
  password: string;
  emailAddress: string;
  age: number;
  gender: string;
  phoneNumber: Number;//Recheck
  bioText:string;
  profileTags: null;//example -recheck
  exercisePreferences: string[];//Recheck data type 
  foodPreferences: string[];//Recheck data type//object mapper
}
