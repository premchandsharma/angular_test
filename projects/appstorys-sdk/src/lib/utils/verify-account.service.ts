import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class VerifyAccountService {
  private apiUrl = 'https://backend.appstorys.com/api/v1/admins/validate-account/';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  async verifyAccount(accountId: string, appId: string): Promise<void> {
    try {

      const body = { account_id: accountId, app_id: appId };
      const headers = new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });

      const response = await this.http.post(this.apiUrl, body, { headers }).toPromise();

      if (response) {
        const { access_token, refresh_token }: any = response;
        if (access_token && refresh_token) {
          this.storageService.setItem('access_token', access_token);
          this.storageService.setItem('refresh_token', refresh_token);
        }
      }
    } catch (error) {
      console.error('Error in verifyAccount', error);
    }
  }
}