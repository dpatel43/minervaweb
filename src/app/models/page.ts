export class Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  size = 2;
  first: boolean ;
  sort: string ;
  numberOfElements: number ;
}
