import { CampaignType } from './types';
import { MediaCampaignDetails} from './campaign-details.interface';

export interface BaseCampaign {
  id: string;
  campaign_type: CampaignType;
}

export interface MediaCampaign extends BaseCampaign {
  campaign_type: 'FLT' | 'BAN' | 'WID' | 'STR';
  details: MediaCampaignDetails;
  position?: String;
}

export type Campaign = MediaCampaign;

export function isMediaCampaign(campaign: Campaign): campaign is MediaCampaign {
  return campaign.campaign_type === 'FLT' || campaign.campaign_type === 'BAN' || campaign.campaign_type === 'WID' ;
}