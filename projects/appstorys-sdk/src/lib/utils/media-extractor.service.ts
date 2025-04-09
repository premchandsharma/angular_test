import { Injectable } from '@angular/core';
import { CampaignData, CAMPAIGN_TYPES } from '../interfaces/campaign';

@Injectable({
  providedIn: 'root'
})
export class MediaExtractorService {

  extractMediaUrls(campaignData: CampaignData): string[] {
    if (!campaignData || !campaignData.campaigns) {
      return [];
    }
    
    const urls: string[] = [];

    campaignData.campaigns.forEach(campaign => {
      const details = campaign.details;
      if (!details) {
        return;
      }

      switch (campaign.campaign_type) {
        case CAMPAIGN_TYPES.BANNER:
        case CAMPAIGN_TYPES.FLOATER:
          if (details.image && this.isValidImageUrl(details.image)) {
            urls.push(details.image);
          }
          break;

        case CAMPAIGN_TYPES.STORY:
          if (Array.isArray(details)) {
            details.forEach((group: any) => {
              if (group.thumbnail && this.isValidImageUrl(group.thumbnail)) {
                urls.push(group.thumbnail);
              }
            });
          }
          break;

        case CAMPAIGN_TYPES.WIDGETS:
          if (details.image && this.isValidImageUrl(details.image)) {
            urls.push(details.image);
          }
          break;

        default:
          break;
      }
    });

    return urls;
  }

  public isValidImageUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      if (parsedUrl.hostname.includes('amazonaws.com')) {
        return parsedUrl.pathname.includes('/banners/') && 
               (parsedUrl.pathname.includes('Image') || 
                parsedUrl.search.includes('image'));
      }
      
      return /\.(jpeg|jpg|png|gif|webp|svg)/i.test(parsedUrl.pathname);
    } catch (error) {
      console.error('[MediaExtractorService] Error validating URL:', error);
      return false;
    }
  }

  async fetchMedia(url: string): Promise<Blob | null> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Accept': 'image/*',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'omit'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        if (blob.size > 0) {
          return blob;
        }
      }
    } catch (error) {
      console.warn('[MediaExtractorService] Direct fetch failed:', error);
    }

    try {
      const blob = await this.fetchViaImgElement(url);
      if (blob) return blob;
    } catch (error) {
      console.warn('[MediaExtractorService] Image element approach failed:', error);
    }

    return null;
  }

  private fetchViaImgElement(url: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeoutId = setTimeout(() => {
        img.src = '';
        resolve(null);
      }, 10000);

      img.onload = () => {
        clearTimeout(timeoutId);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
              resolve(blob);
            } else {
              resolve(null);
            }
          }, 'image/png');
        } catch (error) {
          console.warn('[MediaExtractorService] Canvas operation failed:', error);
          resolve(null);
        }
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        console.warn('[MediaExtractorService] Image load failed:', url);
        resolve(null);
      };

      img.src = url;
    });
  }
}
