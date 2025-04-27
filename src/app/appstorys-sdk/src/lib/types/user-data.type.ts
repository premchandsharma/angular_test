export type UserData = {
    campaigns: Array<CampaignFloater | CampaignBanner>;
    user_id: string;
  };
  
  export type CampaignFloater = {
    id: string;
    campaign_type: 'FLT';
    details: {
      id: string;
      image: string;
      link: string | null;
    };
  };

  export type CampaignBanner = {
    id: string,
    campaign_type: 'BAN',
    details: {
      id: string,
      image: string,
      width: null | number,
      height: null | number,
      link: null | string,
    }
} 