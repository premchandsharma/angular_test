import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelFullScreenComponent } from '../reel-full-screen/reel-full-screen.component';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { Campaign, CAMPAIGN_TYPES, CampaignData, MediaCampaign } from '../../interfaces/campaign';

export interface Reel {
  id?: string;
  thumbnail: string;
  video?: string;
  likes?: number;
  description_text?: string;
  link?: string;
  button_text?: string;
}

export interface ReelStyling {
  thumbnailHeight?: number;
  thumbnailWidth?: number;
  cornerRadius?: number;
}

export interface ReelsDetails {
  reels: Reel[];
  styling?: ReelStyling;
}

@Component({
  selector: 'app-reels',
  standalone: true,
  imports: [CommonModule, ReelFullScreenComponent],
  templateUrl: './reels.component.html',
  styleUrls: ['./reels.component.css']
})
export class ReelsComponent implements OnInit {
  @Input() campaignData?: CampaignData | null;
  campaigns: any[] = [];
  userId: string | undefined;
  
  reelsDetails?: ReelsDetails;
  isFullScreenVisible = false;
  selectedReelIndex = 0;
  data: Campaign | undefined;

  thumbnailWidth = 120;
  thumbnailHeight = 180;
  cornerRadius = 12;

  ngOnInit() {
    this.initializeReels();
  }

  private initializeReels() {
    this.campaigns = this.campaignData!.campaigns;
    if (!this.campaignData) return;

    const reelsCampaign = this.campaigns.find(
      campaign => campaign.campaign_type === 'REL'
    );

    if (reelsCampaign) {
      this.data = reelsCampaign;
      this.reelsDetails = reelsCampaign.details;

      this.userId = this.campaignData?.user_id;
      
      if (this.reelsDetails!.styling) {
        this.thumbnailWidth = this.reelsDetails!.styling.thumbnailWidth || 120;
        this.thumbnailHeight = this.reelsDetails!.styling.thumbnailHeight || 180;
        this.cornerRadius = this.reelsDetails!.styling.cornerRadius || 12;
      }
    }
  }

  openFullScreen(index: number) {
    this.selectedReelIndex = index;
    this.isFullScreenVisible = true;
  }

  closeFullScreen() {
    this.isFullScreenVisible = false;
    this.selectedReelIndex = 0;
  }
}