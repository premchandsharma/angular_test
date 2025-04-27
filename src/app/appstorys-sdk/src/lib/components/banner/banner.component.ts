import {
  Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild,
  ElementRef, AfterViewInit, Inject, PLATFORM_ID,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { CAMPAIGN_TYPES, CampaignData, MediaCampaign } from '../../interfaces/campaign';
import { ActionType } from '../../types/action.types';
import { MediaCacheService } from '../../utils/media-cache.service';
import { MediaExtractorService } from '../../utils/media-extractor.service';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() campaignData?: CampaignData | null;
  @ViewChild('lottieContainer', { static: false }) lottieContainerRef?: ElementRef;

  bannerVisible = true;
  data?: MediaCampaign;
  cachedImageUrl: string | null = null;
  isLoading = true;
  loadError = false;

  isBrowser: boolean;

  constructor(
    private userActionTrackService: TrackUserActionService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private mediaCacheService: MediaCacheService,
    private mediaExtractor: MediaExtractorService,
    private cdr: ChangeDetectorRef
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.initializeBanner();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaignData']) {
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loadLottieIfAvailable();
    }
  }

  private async initializeBanner(): Promise<void> {
    if (!this.campaignData?.campaigns) return;

    await this.mediaCacheService.preCacheMedia(this.campaignData);

    const banners = this.campaignData.campaigns
      .filter(campaign => campaign.campaign_type === CAMPAIGN_TYPES.BANNER) as MediaCampaign[];

    if (banners.length > 0) {
      this.data = banners[0];
      await this.loadAndCacheImage();
      this.trackImpression();
    }
  }

  private async loadAndCacheImage(): Promise<void> {
    if (!this.data?.details?.image) {
      this.isLoading = false;
      return;
    }

    const imageUrl = this.data.details.image;
    this.isLoading = true;
    this.loadError = false;

    try {
      let cachedBlob = await this.mediaCacheService.retrieveMedia(imageUrl);
      
      if (!cachedBlob) {
        const imageBlob = await this.mediaExtractor.fetchMedia(imageUrl);
        
        if (!imageBlob) {
          throw new Error('Failed to fetch image');
        }

        await this.mediaCacheService.storeMedia(imageUrl, imageBlob);
        cachedBlob = imageBlob;
      }

      if (cachedBlob) {
        if (this.cachedImageUrl) {
          URL.revokeObjectURL(this.cachedImageUrl);
        }
        
        this.cachedImageUrl = URL.createObjectURL(cachedBlob);
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error loading image:', error);
      this.loadError = true;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private async loadLottieIfAvailable(): Promise<void> {
    const lottieUrl = this.data?.details?.lottie_data;
    const container = this.lottieContainerRef?.nativeElement;
  
    if (lottieUrl && container) {
      const lottie = (await import('lottie-web')).default;
      lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: lottieUrl
      });
    }
  }

  gettopLeftRadius(): string {
    return this.data?.details?.styling?.topLeftRadius ? `${this.data?.details?.styling?.topLeftRadius}px` : '0px';
  }
  gettopRightRadius(): string {
    return this.data?.details?.styling?.topRightRadius ? `${this.data?.details?.styling?.topRightRadius}px` : '0px';
  }
  getbottomLeftRadius(): string {
    return this.data?.details?.styling?.bottomLeftRadius ? `${this.data?.details?.styling?.bottomLeftRadius}px` : '0px';
  }
  getbottomRightRadius(): string {
    return this.data?.details?.styling?.bottomRightRadius ? `${this.data?.details?.styling?.bottomRightRadius}px` : '0px';
  }

  enableCloseButton(): boolean {
    return this.data?.details?.styling?.enableCloseButton ? this.data?.details?.styling?.enableCloseButton : false;
  }

  getBottomMargin(): string {
    return this.data?.details?.styling?.marginBottom ? `${this.data?.details?.styling?.marginBottom}px` : '20px';
  }

  getHeight(): string {
    const bannerWidth = this.data?.details?.width || null;
    const bannerHeight = this.data?.details?.height || null;

    if (bannerWidth != null) {
      return 'auto';
    } else {
      return bannerHeight != null ? `${bannerHeight}px` : 'auto';
    }
  }


  private async trackImpression(): Promise<void> {
    if (!this.campaignData?.user_id || !this.data?.id) return;

    try {
      await this.userActionTrackService.trackUserAction(
        this.campaignData.user_id,
        this.data.id,
        ActionType.IMPRESSION
      );
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async onBannerClick(): Promise<void> {
    if (!this.campaignData?.user_id || !this.data?.id) return;

    if (!this.data.details?.link) return;

    try {
      await this.userActionTrackService.trackUserAction(
        this.campaignData.user_id,
        this.data.id,
        ActionType.CLICK
      );
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    window.open(this.data.details.link, '_blank');
  }

  closeBanner(): void {
    if (this.cachedImageUrl) {
      URL.revokeObjectURL(this.cachedImageUrl);
      this.cachedImageUrl = null;
    }
    this.bannerVisible = false;
  }

  ngOnDestroy(): void {
    if (this.cachedImageUrl) {
      URL.revokeObjectURL(this.cachedImageUrl);
    }
  }
}