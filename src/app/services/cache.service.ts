import {Injectable} from '@angular/core';
import {HttpService} from "./http.service";
import {HttpParams} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class CacheService {

  constructor(private httpService: HttpService) {
  }

  findResults(cacheName: string, query: string) {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('cache', cacheName);
    httpParams = httpParams.append('query', query);
    return this.httpService.get('/api/cache', httpParams);
  }

  findStaticCodes(cacheGroup: string) {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('codegroup', cacheGroup);
    return this.httpService.get('/api/codecache', httpParams);
  }
}
