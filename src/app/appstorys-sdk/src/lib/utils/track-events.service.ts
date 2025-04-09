import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { StorageService } from './storage.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventTrackingService {
  private eventUrl = 'https://tracking.appstorys.com/capture-event';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  async getAccessToken(): Promise<string | null> {
    return this.storageService.getItem('access_token');
  }

  async trackEvent(
    userId: string,
    eventType: string,
    campaignId: string | null = null,
    metadata: Record<string, any> | null = null
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      console.error('Access token not found');
      return;
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    });

    const body: any = {
      user_id: userId,
      event_type: eventType,
    };

    if (campaignId) {
      body.campaign_id = campaignId;
    }

    if (metadata) {
      body.metadata = metadata;
    }

    return this.http.post<any>(this.eventUrl, body, { headers }).pipe(
      catchError((error) => {
        console.error('Error in trackEvent', error);
        return of(null);
      })
    ).toPromise();
  }
}
