import { Campaign } from './campaign.interface';

export interface CampaignData {
  campaigns: Campaign[];
  access_token: string;
  user_id: string;
}