import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AppStorysService } from './utils/app-storys.service';
import { FloaterComponent } from './components/floater/floater.component';
import { BannerComponent } from './components/banner/banner.component';
import { WidgetsComponent } from './components/widgets/widgets.component';
import { StoriesComponent } from './components/stories/stories.component';
import { PipComponent } from './components/pip/pip.component';
import { ReelsComponent } from './components/reels/reels.component';


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
