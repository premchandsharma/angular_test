import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { ActionType } from '../../types/action.types';
import { CampaignData, MediaCampaign, CAMPAIGN_TYPES } from '../../interfaces/campaign';
import { MediaCacheService } from '../../utils/media-cache.service';
import { MediaExtractorService } from '../../utils/media-extractor.service';

@Component({
  selector: 'app-floater',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floater.component.html',
  styleUrls: ['./floater.component.css']
})
export class FloaterComponent implements OnInit, OnChanges {
  @Input() campaignData?: CampaignData | null;

  data?: MediaCampaign;
  cachedImageUrl: string | null = null;
  isLoading = true;
  loadError = false;

  constructor(
    private userActionTrackService: TrackUserActionService,
    private mediaCacheService: MediaCacheService,
    private mediaExtractor: MediaExtractorService,
    private cdr: ChangeDetectorRef

  ) { }

  ngOnInit(): void {
    this.initializeFloater();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaignData']) {
    }
  }

  private async initializeFloater(): Promise<void> {
    if (!this.campaignData?.campaigns) return;

    await this.mediaCacheService.preCacheMedia(this.campaignData);

    const floaters = this.campaignData.campaigns
      .filter(campaign => campaign.campaign_type === CAMPAIGN_TYPES.FLOATER) as MediaCampaign[];

    if (floaters.length > 0) {
      this.data = floaters[0];
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

  getPosition(): { [key: string]: string } {
    return this.data?.details?.position === 'left' ? {
      alignItems: 'flex-start',
      left: '20px'
    } : {
      alignItems: 'flex-end',
      right: '20px',
    };
  }

  getWidth(): string {
    return this.data?.details?.width ? `${this.data.details.width}px` : '60px';
  }

  getHeight(): string {
    return this.data?.details?.height ? `${this.data.details.height}px` : '60px';
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

  async onFloaterClick(): Promise<void> {

    if (!this.campaignData?.user_id || !this.data?.id) return;

    if(!this.data.details?.link) return;

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

  ngOnDestroy(): void {
    if (this.cachedImageUrl) {
      URL.revokeObjectURL(this.cachedImageUrl);
    }
  }
}