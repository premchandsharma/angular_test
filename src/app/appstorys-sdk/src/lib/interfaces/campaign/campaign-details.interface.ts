export interface BaseCampaignDetails {
  id: string;
  image: string;
  link?: string | null;
}

export interface MediaCampaignDetails extends BaseCampaignDetails {
  width?: number | null;
  height?: number | null;
  lottie_data?: string | null;
  type?: 'full' | 'half';
  position?: 'left' | 'right' | 'center';
  widget_images?: WidgetImage[];
  styling?: Styling;
}

export interface Styling {
  marginBottom?: string;
  topLeftRadius?: string;
  topRightRadius?: string;
  bottomLeftRadius?: string;
  bottomRightRadius?: string;
  enableCloseButton?: boolean;
}

interface WidgetImage {
  id: string;
  image: string;
  link: string;
  order: number;
  lottie_data?: string | null;
}

export interface StorySlide {
  id: string;
  image?: string;
  video?: string;
  link?: string;
  button_text?: string;
}

export interface StoryGroup {
  id: string;
  name: string;
  thumbnail: string;
  slides: StorySlide[];
  ringColor?: string;
  nameColor?: string;
}

export interface SurveyCampaignDetails extends BaseCampaignDetails {
  surveyQuestion: string;
  surveyOptions: { [key: string]: string };
  hasOthers?: boolean;
  styling: {
    backgroundColor: string;
    surveyQuestionColor: string;
    optionColor: string;
    optionTextColor: string;
    selectedOptionColor: string;
    selectedOptionTextColor: string;
    othersBackgroundColor?: string;
    ctaBackgroundColor: string;
    ctaTextIconColor: string;
  };
}