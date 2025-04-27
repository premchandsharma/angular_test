export type CampaignType = 'FLT' | 'BAN' | 'SUR' | 'STR' | 'WID';

export const CAMPAIGN_TYPES = {
  FLOATER: 'FLT' as const,
  BANNER: 'BAN' as const,
  SURVEY: 'SUR' as const,
  STORY: 'STR' as const,
  WIDGETS: 'WID' as const,
} as const;