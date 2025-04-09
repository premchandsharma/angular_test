import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FloaterComponent } from '../appstorys-sdk/src/lib/components/floater/floater.component';
import { BannerComponent } from '../appstorys-sdk/src/lib/components/banner/banner.component';
import { BehaviorSubject } from 'rxjs';
import { AppStorysService } from '../appstorys-sdk/src/lib/utils/app-storys.service';
import { CampaignData } from '../appstorys-sdk/src/public-api';

import { features } from './data/features.data';
import { testimonials } from './data/testimonials.data';
import { Feature } from './models/feature.model';
import { Testimonial } from './models/testimonial.model';
import { WidgetsComponent } from "../appstorys-sdk/src/lib/components/widgets/widgets.component";
import { StoriesComponent } from "../appstorys-sdk/src/lib/components/stories/stories.component";
import { Observable } from 'rxjs';
import { PipComponent } from "../appstorys-sdk/src/lib/components/pip/pip.component";
import { ReelsComponent } from "../appstorys-sdk/src/lib/components/reels/reels.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    FloaterComponent,
    BannerComponent,
    WidgetsComponent,
    StoriesComponent,
    PipComponent,
    ReelsComponent
],
  providers: [AppStorysService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly appId = '9e1b21a2-350a-4592-918c-2a19a73f249a';
  private readonly accountId = '4350bf8e-0c9a-46bd-b953-abb65ab21d11';
  private readonly userId = 'akdnnqsdqsdqsdsa';
  private readonly screenName = 'Home Screen';
  private readonly attributes = [
    {
      'key': 'value'
    }
  ];

  readonly features: Feature[] = features;
  readonly testimonials: Testimonial[] = testimonials;

  // isLoading$ = new BehaviorSubject<boolean>(false);
  error$ = new BehaviorSubject<string | null>(null);
  campaignData$ = new BehaviorSubject<CampaignData | null>(null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appStorysService: AppStorysService
  ) { }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (!this.isBrowser()) {
      return;
    }

    this.initializeCampaigns();
  }

  private async initializeCampaigns(): Promise<void> {
    // this.isLoading$.next(true);

    try {

      const { accessToken, userData } = await this.appStorysService.initialize(
        this.appId,
        this.accountId,
        this.userId,
        this.screenName,
        this.attributes,
      );

      this.campaignData$.next({
        campaigns: userData.campaigns,
        access_token: accessToken!,
        user_id: this.userId
      });

      console.log('Campaigns initialized:', userData.campaigns);

    } catch (error) {
      console.error('Error initializing campaigns:', error);
      this.error$.next('Failed to initialize campaigns');
    }
    // finally {
    //   this.isLoading$.next(false);
    // }
  }
}