import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { VerifyAccountService } from './utils/verify-account.service';
import { VerifyUserService } from './utils/verify-user.service';
import { TrackScreenService } from './utils/track-screen.service';
import { TrackUserActionService } from './utils/track-user-action.service';
import { AppStorysService } from './utils/app-storys.service';
import { PipComponent, StoriesComponent, WidgetsComponent, FloaterComponent, BannerComponent, ReelsComponent } from 'appstorys-sdk';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    FloaterComponent,
    BannerComponent,
    WidgetsComponent,
    StoriesComponent,
    PipComponent,
    ReelsComponent,
  ],
  providers: [
    VerifyAccountService,
    VerifyUserService,
    TrackScreenService,
    TrackUserActionService,
    AppStorysService,
  ],
  exports: [
    FloaterComponent,
    BannerComponent,
    WidgetsComponent,
    StoriesComponent,
    PipComponent,
    ReelsComponent,
  ],
})
export class AppStorysSdkModule { }
