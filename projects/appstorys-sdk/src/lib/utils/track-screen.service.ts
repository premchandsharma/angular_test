import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TrackScreenService {
  private apiUrl = 'https://backend.appstorys.com/api/v1/users/track-screen/';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  async getAccessToken(): Promise<string | null> {
    return this.storageService.getItem('access_token');
  }

  async trackScreen(screenName: string, positionList?: string[]): Promise<any[]> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.error('Access token not found');
      return [];
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    });

    const body = {
      screen_name: screenName,
      ...(positionList?.length ? { position_list : positionList } : {})
    };

    return this.http.post<any>(this.apiUrl, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error in trackScreen', error);
        return of([]);
      })
    ).toPromise();
  }
}