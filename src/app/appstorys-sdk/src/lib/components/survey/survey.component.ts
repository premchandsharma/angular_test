import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CAMPAIGN_TYPES, CampaignData, MediaCampaign } from '../../interfaces/campaign';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { ActionType } from '../../types/action.types';
import { CaptureSurveyResponseService } from '../../utils/capture-survey-response.service';

export interface CampaignSurvey {
  id: string;
  campaign_type: string;
  details: SurveyDetails;
}

export interface SurveyDetails {
  id: string;
  name: string;
  styling: SurveyStyling;
  surveyQuestion: string;
  surveyOptions: SurveyOptions;
  campaign: string;
  hasOthers: boolean;
}

export interface SurveyStyling {
  optionColor: string;
  displayDelay: string;
  backgroundColor: string;
  optionTextColor: string;
  othersTextColor: string;
  surveyTextColor: string;
  ctaTextIconColor: string;
  ctaBackgroundColor: string;
  selectedOptionColor: string;
  surveyQuestionColor: string;
  othersBackgroundColor: string;
  selectedOptionTextColor: string;
}

export interface SurveyOptions {
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  [key: string]: string;
}

@Component({
  selector: 'app-survey',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey.component.html',
  styleUrl: './survey.component.css'
})
export class SurveyComponent implements OnInit, AfterViewInit {
  constructor(
      private userActionTrackService: TrackUserActionService,
      private captureSurveyResponseService: CaptureSurveyResponseService
    ) {
    }
  @Input() campaignData?: CampaignData | null;
  campaigns: any[] = [];
  userId: string | undefined;
  surveyDetails?: SurveyDetails;

  data?: MediaCampaign;

  optionList: { key: string; value: string }[] = [];

  selectedOptions: string[] = [];
  othersText: string = '';

  ngAfterViewInit(): void {
  }

  ngOnInit(): void {
    this.initializeSurvey();
  }

  private initializeSurvey() {
    this.campaigns = this.campaignData!.campaigns;
    if (!this.campaignData) {
      this.isVisible = false;
      return;
    }

    const surveyCampaign = this.campaigns.find(
      campaign => campaign.campaign_type === 'SUR'
    );

    if (surveyCampaign) {
      this.data = surveyCampaign;
      this.surveyDetails = surveyCampaign.details;
      this.userId = this.campaignData.user_id;

      const delayInSeconds = Number(this.surveyDetails?.styling?.displayDelay) || 0;

      setTimeout(() => {
        this.isVisible = true;
        document.body.style.overflow = 'hidden';
        this.trackImpression();
      }, delayInSeconds * 1000);


      console.log('Survey Details:', this.data);

      const surveyOptions = this.surveyDetails?.surveyOptions;
      if (surveyOptions) {
        this.optionList = Object.keys(surveyOptions).map(key => ({
          key,
          value: surveyOptions[key]
        }));
      }
    } else {
      this.isVisible = false;
    }
  }

  @Output() surveySubmitted = new EventEmitter<string>();

  isVisible = false;
  selectedOption: string | null = null;

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

  openSurvey(): void {
    this.isVisible = true;
    document.body.style.overflow = 'hidden';
  }

  closeSurvey(): void {
    this.isVisible = false;
    document.body.style.overflow = '';
  }

  selectOption(option: string): void {
    const index = this.selectedOptions.indexOf(option);
    if (index > -1) {
      // Already selected → unselect it
      this.selectedOptions.splice(index, 1);
    } else {
      // Not selected → add it
      this.selectedOptions.push(option);
    }
  }

  async submitSurvey(): Promise<void> {
    if (this.selectedOptions.length > 0) {
      if (!this.campaignData?.user_id || !this.data?.id) return;

      try {
        await this.captureSurveyResponseService.captureSurveyResponse(
          this.surveyDetails!.id,
          this.campaignData.user_id,
          this.selectedOptions,
          this.othersText,
        );
        console.log('Survey submitted');
      } catch (error) {
        console.error('Error submitting survey:', error);
      }
      this.closeSurvey();
      this.selectedOption = null;
    }
  }

  getOptionStyle(optionKey: string) {
    const isSelected = this.selectedOptions.includes(optionKey);
    const styling = this.surveyDetails?.styling;
  
    return {
      'background-color': isSelected
        ? styling?.selectedOptionColor || '#f7ead3'
        : styling?.optionColor || '#ffffff',
      'color': isSelected
        ? styling?.selectedOptionTextColor || '#000000'
        : styling?.optionTextColor || '#000000'
    };
  }

  getTextColor(optionKey: string): string {
    const isSelected = this.selectedOptions.includes(optionKey);
    const styling = this.surveyDetails?.styling;
  
    return isSelected
      ? styling?.selectedOptionTextColor || '#000000'
      : styling?.optionTextColor || '#000000';
  }
}