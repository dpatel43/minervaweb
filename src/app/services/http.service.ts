/*
 *  Copyright (C) Minerva Systems, Inc - All Rights Reserved
 *  * Unauthorized copying of this file, via any medium is strictly prohibited
 *  * Proprietary and confidential.
 *
 */

import {Injectable, OnInit} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";

const JSON_CONTENT_TYPE = "application/json";
//const MULTIPART_CONTENT_TYPE = "application/octet-stream";
const MULTIPART_CONTENT_TYPE = 'multipart/form-data';

@Injectable({
  providedIn: 'root'
})
export class HttpService implements OnInit {

  private apiServer: string | undefined;

  constructor(private http: HttpClient) {
    console.log((window as any).__env);
    this.apiServer = environment.apiServer;
    if ((window as any).__env) {
      this.apiServer = (window as any).__env?.apiServer;
    } else {
      console.error("Missing apiServer property");
    }
  }

  private createRequestHeader(contentType: string) {
    let headers = new HttpHeaders({
      "Content-Type": contentType
    });

    return headers;
  }

  public get(url: string, params? : HttpParams) : Observable<any> {
    const requestOptions = this.createRequestHeader(JSON_CONTENT_TYPE);
    return this.http.get(this.getURL(url), { headers: requestOptions, params: params });
  }

  getURL(baseUrl: string) {
    console.log("API Server: " + this.apiServer);
    return this.apiServer + baseUrl;
  }

  public put(url: string, body: any): Observable<any> {
    const requestOptions = this.createRequestHeader(JSON_CONTENT_TYPE);
    return this.http.put(this.getURL(url), body, {headers: requestOptions});
  }

  public post(url: string, body: any) : Observable<any> {
    const requestOptions = this.createRequestHeader(JSON_CONTENT_TYPE);
    return this.http.post(this.getURL(url), body, { headers: requestOptions });
  }

  public multipart(url: string, formData: FormData) {
   // const requestOptions = this.createRequestHeader(JSON_CONTENT_TYPE);
    return this.http.post(this.getURL(url), formData, { headers: new HttpHeaders({ Accept: 'application/json' }) });
  }

  ngOnInit(): void {
  }

}
