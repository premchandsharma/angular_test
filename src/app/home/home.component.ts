import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FloaterComponent } from '../appstorys-sdk/src/lib/components/floater/floater.component';
import { BannerComponent } from '../appstorys-sdk/src/lib/components/banner/banner.component';
import { BehaviorSubject } from 'rxjs';
import { AppStorysService } from '../appstorys-sdk/src/lib/utils/app-storys.service';
import { CampaignData } from '../appstorys-sdk/src/public-api';
import { WidgetsComponent } from "../appstorys-sdk/src/lib/components/widgets/widgets.component";
import { StoriesComponent } from "../appstorys-sdk/src/lib/components/stories/stories.component";
import { PipComponent } from "../appstorys-sdk/src/lib/components/pip/pip.component";
import { ReelsComponent } from "../appstorys-sdk/src/lib/components/reels/reels.component";
import { TooltipsComponent } from '../appstorys-sdk/src/lib/components/tooltips/tooltips.component';
import { SurveyComponent } from "../appstorys-sdk/src/lib/components/survey/survey.component";

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
    ReelsComponent,
    TooltipsComponent,
    SurveyComponent
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

  campaignData$ = new BehaviorSubject<CampaignData | null>(null);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private appStorysService: AppStorysService
  ) { }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit() {
    if (this.isBrowser()) {
      this.initializeCampaigns();
    }
  }

  private async initializeCampaigns(): Promise<void> {

    try {
      await this.appStorysService.initialize(
        this.appId,
        this.accountId,
        this.userId,
        this.attributes,
      );

      const userData = await this.appStorysService.getScreenCamapigns(
        this.screenName,
        ["banner_bottom"]
      );

      this.campaignData$.next({
        campaigns: userData.campaigns,
        user_id: this.userId
      });

    } catch (error) {
      console.error('Error initializing campaigns:', error);
    }
  }
}