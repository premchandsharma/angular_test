import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { StorageService } from './storage.service';
import { ErrorHandlerService } from './error-handler.service';
import { ApiResponse } from '../interfaces/api-error.interface';
import { UserData } from './user-data.type';
import { VerifyUserRequest, UserAttributes } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class VerifyUserService {
  private apiUrl = 'https://backend.appstorys.com/api/v1/users/track-user/';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ErrorHandlerService
  ) {}

  async verifyUser(userId: string, campaigns: any, attributes?: UserAttributes): Promise<UserData | undefined> {
    try {
      if (!campaigns?.campaigns.length) {
        console.warn('No campaigns found');
        return;
      }

      const appId = this.storageService.getItem('app_id');
      const accessToken = this.storageService.getItem('access_token');

      if (!appId || !accessToken) {
        throw new Error('Missing required authentication data');
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      });

      const body = {
        user_id: userId,
        app_id: appId,
        campaign_list: campaigns.campaigns,
        ...(attributes && { attributes })
      };

      const response = await this.http.post<any>(
        this.apiUrl,
        body,
        { headers }
      ).pipe(
        catchError((error: HttpErrorResponse) => {
          const apiError = this.errorHandler.handleError(error);
          console.error('Error in verifyUser:', apiError);
          return throwError(() => apiError);
        })
      ).toPromise();

      if (response?.campaigns) {
        return {
          user_id: userId,
          campaigns: response.campaigns
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error in verifyUser:', error);
      throw error;
    }
  }
}