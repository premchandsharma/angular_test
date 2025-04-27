import { Injectable } from '@angular/core';
import { TrackScreenService } from './track-screen.service';
import { VerifyAccountService } from './verify-account.service';
import { VerifyUserService } from './verify-user.service';
import { UserAttributes } from '../interfaces/user.interface';
import { EventTrackingService } from './track-events.service';

@Injectable({
  providedIn: 'root'
})
export class AppStorysService {

  private userId!: string;
  private attributes?: UserAttributes;

  constructor(
    private trackScreenService: TrackScreenService,
    private verifyAccountService: VerifyAccountService,
    private verifyUserService: VerifyUserService,
    private eventTrackingService: EventTrackingService
  ) { }

  async initialize(appId: string, accountId: string, userId: string, attributes?: any): Promise<any> {

    this.userId = userId;
    this.attributes = attributes;

    await this.verifyAccount(accountId, appId);
  }

  async getScreenCamapigns(screenName: string, positionList?: string[]): Promise<any> {

    const screenData = await this.trackScreen(screenName, positionList);
    if (!screenData?.campaigns) {
      throw new Error('No campaigns available');
    }

    const userData = await this.verifyUser(this.userId, screenData, this.attributes);
    if (!userData) {
      throw new Error('Failed to get user campaign data');
    }

    return userData;
  }

  private async verifyAccount(accountId: string, appId: string): Promise<void> {
    return this.verifyAccountService.verifyAccount(accountId, appId);
  }

  private async trackScreen(screenName: string, positionList?: string[]): Promise<any> {
    return this.trackScreenService.trackScreen(screenName, positionList);
  }

  private async verifyUser(userId: string, campaigns: any, attributes?: UserAttributes): Promise<any> {
    return this.verifyUserService.verifyUser(userId, campaigns, attributes);
  }

  async trackCustomEvents(userId: string, eventType: string, campaignId: string | null = null, metadata: Record<string, any> | null = null): Promise<void> {
    return this.eventTrackingService.trackEvent(this.userId, eventType, campaignId, metadata);
  }
}