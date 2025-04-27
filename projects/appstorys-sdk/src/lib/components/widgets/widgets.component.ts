import { 
  Component, HostListener, Input, OnInit, OnChanges, SimpleChanges, 
  ViewChildren, AfterViewInit, QueryList, ElementRef, Inject, PLATFORM_ID, 
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { CAMPAIGN_TYPES, CampaignData, MediaCampaign } from '../../interfaces/campaign';
import { ActionType } from '../../types/action.types';
import { MediaCacheService } from '../../utils/media-cache.service';
import { MediaExtractorService } from '../../utils/media-extractor.service';

@Component({
  selector: 'app-widgets',
  templateUrl: './widgets.component.html',
  styleUrls: ['./widgets.component.css'],
  imports: [CommonModule],
  standalone: true,
})
export class WidgetsComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() campaignData?: CampaignData | null;
  @Input() position?: string | null;
  @ViewChildren('carouselImage') carouselImages!: QueryList<ElementRef>;
  @ViewChildren('lottieContainer') lottieContainers!: QueryList<ElementRef>;

  data?: MediaCampaign;
  cachedImageUrls: Map<string, string> = new Map();
  isLoading = true;
  loadError = false;

  items: string[] = [];
  lottieUrls: string[] = [];
  currentIndex: number = 1;
  transition: string = 'transform 0.5s ease-in-out';
  isMobileView: boolean = false;
  private touchStartX: number = 0;
  private touchEndX: number = 0;
  private observer: IntersectionObserver | null = null;
  private widgetObserver: IntersectionObserver | null = null;
  private trackedImageIds: Set<string> = new Set();
  private autoSlideInterval: any;
  private isWidgetVisible: boolean = false;
  isBrowser: boolean;

  constructor(
    private userActionTrackService: TrackUserActionService,
    private elementRef: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    private mediaCacheService: MediaCacheService,
    private mediaExtractor: MediaExtractorService,
    private cdr: ChangeDetectorRef
  ) {
    this.updateViewMode();
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.initializeWidgets();
  }

  ngAfterViewInit(): void {
    this.setupWidgetVisibilityObserver();
    this.setupIntersectionObserver();
    
    if (this.isBrowser) {
      setTimeout(() => {
        this.loadLottieAnimations();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.widgetObserver) {
      this.widgetObserver.disconnect();
    }
    this.stopAutoSlide();
    
    this.cachedImageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }

  private async loadLottieAnimations(): Promise<void> {
    if (!this.isBrowser || !this.data?.details.widget_images) return;
    
    const lottieContainers = this.lottieContainers.toArray();
    if (!lottieContainers.length) return;
    
    const lottie = (await import('lottie-web')).default;
    
    lottieContainers.forEach((container, index) => {
      const widgetIndex = this.getLottieWidgetIndex(index);
      if (widgetIndex === -1 || !this.data?.details.widget_images) return;
      
      const lottieUrl = this.data.details.widget_images[widgetIndex].lottie_data;
      if (lottieUrl && container.nativeElement) {
        lottie.loadAnimation({
          container: container.nativeElement,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: lottieUrl
        });
      }
    });
  }

  private getLottieWidgetIndex(containerIndex: number): number {
    if (!this.data?.details.widget_images) return -1;
    
    let count = 0;
    for (let i = 0; i < this.data.details.widget_images.length; i++) {
      if (this.hasLottie(i)) {
        if (count === containerIndex) return i;
        count++;
      }
    }
    return -1;
  }

  hasLottie(index: number): boolean {
    if (!this.data?.details.widget_images || 
        index >= this.data.details.widget_images.length) return false;
    
    return !!this.data.details.widget_images[index].lottie_data && 
           !this.data.details.widget_images[index].image;
  }

  hasImage(index: number): boolean {
    if (!this.data?.details.widget_images || 
        index >= this.data.details.widget_images.length) return false;
    
    return !!this.data.details.widget_images[index].image;
  }

  private startAutoSlide(): void {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private setupWidgetVisibilityObserver(): void {
    const options = {
      root: null,
      threshold: 0.5
    };

    this.widgetObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isWidgetVisible = entry.isIntersecting;
      });
    }, options);

    this.widgetObserver.observe(this.elementRef.nativeElement);
  }

  private setupIntersectionObserver(): void {
    const options = {
      root: null,
      threshold: 0.5
    };
  
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && this.isWidgetVisible) {
          if (this.data?.details.type === 'half') {
            const currentPairIndex = this.getCurrentSlideIndex();
            const pair = this.getHalfWidgetPair(currentPairIndex);
  
            const firstImageId = this.data?.details.widget_images![pair.first]?.id;
            if (firstImageId && !this.trackedImageIds.has(firstImageId)) {
              this.trackImpression(pair.first);
              this.trackedImageIds.add(firstImageId);
            }
  
            const secondImageId = this.data?.details.widget_images![pair.second]?.id;
            if (secondImageId && !this.trackedImageIds.has(secondImageId)) {
              this.trackImpression(pair.second);
              this.trackedImageIds.add(secondImageId);
            }
          } else {
            const imageId = this.data?.details.widget_images![this.getCurrentSlideIndex()]?.id;
            if (imageId && !this.trackedImageIds.has(imageId)) {
              this.trackImpression(this.getCurrentSlideIndex());
              this.trackedImageIds.add(imageId);
            }
          }
        }
      });
    }, options);
  
    setTimeout(() => {
      this.carouselImages.forEach(imageRef => {
        this.observer?.observe(imageRef.nativeElement);
      });
      
      this.lottieContainers.forEach(containerRef => {
        this.observer?.observe(containerRef.nativeElement);
      });
    }, 500);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['campaignData']) {
      this.initializeWidgets();
    }
  }

  private async initializeWidgets(): Promise<void> {
    if (!this.campaignData?.campaigns) return;
  
    await this.mediaCacheService.preCacheMedia(this.campaignData);
  
    const widgets = this.campaignData.campaigns
      .filter(campaign => campaign.campaign_type === CAMPAIGN_TYPES.WIDGETS) as MediaCampaign[];
  
    const matchingWidgets = widgets.filter(widget => 
      !widget.position || widget.position === this.position
    );
  
    if (matchingWidgets.length > 0) {
      this.data = matchingWidgets[0];
      
      if (this.data.details.widget_images) {
        this.items = this.data.details.widget_images.map(widget => widget.image || '');
        this.lottieUrls = this.data.details.widget_images
          .filter(widget => widget.lottie_data)
          .map(widget => widget.lottie_data || '');
        
        await this.loadAndCacheImages();

        if (this.shouldEnableSliding()) {
          this.startAutoSlide();
        }
      }
      
      if (this.isBrowser) {
        setTimeout(() => {
          this.loadLottieAnimations();
        }, 0);
      }
    }
  }

  private async loadAndCacheImages(): Promise<void> {
    this.isLoading = true;
    this.loadError = false;
  
    try {
      this.cachedImageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      this.cachedImageUrls.clear();
  
      for (let i = 0; i < this.items.length; i++) {
        const imageUrl = this.items[i];
        
        if (!imageUrl) {
          continue;
        }
        
        if (this.cachedImageUrls.has(imageUrl)) {
          continue;
        }
        
        let cachedBlob = await this.mediaCacheService.retrieveMedia(imageUrl);
        
        if (!cachedBlob) {
          const imageBlob = await this.mediaExtractor.fetchMedia(imageUrl);
          
          if (!imageBlob) {
            this.cachedImageUrls.set(imageUrl, imageUrl);
            continue;
          }
  
          await this.mediaCacheService.storeMedia(imageUrl, imageBlob);
          cachedBlob = imageBlob;
        } else {
        }
  
        if (cachedBlob) {
          const objectUrl = URL.createObjectURL(cachedBlob);
          this.cachedImageUrls.set(imageUrl, objectUrl);
        } else {
          this.cachedImageUrls.set(imageUrl, imageUrl);
        }
      }
      
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading images:', error);
      this.loadError = true;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  getHeight(): string {
    const widgetWidth = this.data?.details?.width || null;
    const widgetHeight = this.data?.details?.height || null;

    if (widgetWidth != null || widgetHeight != null) {
      return 'auto';
    } else {
      return widgetHeight != null ? `${widgetHeight}px` : 'auto';
    }
  }

  getWidth(): string {
    return '100%';
  }

  private async trackImpression(index: number): Promise<void> {
    if (!this.campaignData?.user_id || !this.data?.id || !this.isWidgetVisible) return;

    const imageId = this.data.details.widget_images![index].id;
    if (this.trackedImageIds.has(imageId)) return;

    try {
      await this.userActionTrackService.trackUserAction(
        this.campaignData.user_id,
        this.data.id,
        ActionType.IMPRESSION,
        undefined,
        imageId
      );
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async trackClicks(index?: number): Promise<void> {
    if (!this.campaignData?.user_id || !this.data?.id) return;

    try {
      const slideIndex = index !== undefined ? index : this.getCurrentSlideIndex();
      const selectedImage = this.data.details.widget_images![slideIndex];

      if (!selectedImage || !selectedImage.link) return;

      await this.userActionTrackService.trackUserAction(
        this.campaignData.user_id,
        this.data.id,
        ActionType.CLICK,
        undefined,
        selectedImage.id,
      );

      window.open(selectedImage.link, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  @HostListener('window:resize', [])
  updateViewMode(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  get translateX(): number {
    return -this.currentIndex * 100;
  }

  nextSlide(): void {
    this.stopAutoSlide();
    this.transition = 'transform 0.5s ease-in-out';
    this.currentIndex++;
  
    if (this.data?.details.type === 'half') {
      const totalPairs = Math.ceil(this.items.length / 2);
      
      if (this.currentIndex === totalPairs + 1) {
        setTimeout(() => {
          this.transition = 'none';
          this.currentIndex = 1;
        }, 500);
      }
    } else {
      if (this.currentIndex === this.items.length + 1) {
        setTimeout(() => {
          this.transition = 'none';
          this.currentIndex = 1;
        }, 500);
      }
    }
    this.startAutoSlide();
  }
  
  prevSlide(): void {
    this.stopAutoSlide();
    this.transition = 'transform 0.5s ease-in-out';
    this.currentIndex--;
  
    if (this.data?.details.type === 'half') {
      if (this.currentIndex === 0) {
        const totalPairs = Math.ceil(this.items.length / 2);
        setTimeout(() => {
          this.transition = 'none';
          this.currentIndex = totalPairs;
        }, 500);
      }
    } else {
      if (this.currentIndex === 0) {
        setTimeout(() => {
          this.transition = 'none';
          this.currentIndex = this.items.length;
        }, 500);
      }
    }
    this.startAutoSlide();
  }

  onTouchStart(event: TouchEvent): void {
    this.stopAutoSlide();
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchMove(event: TouchEvent): void {
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(): void {
    const deltaX = this.touchStartX - this.touchEndX;
    const threshold = 50;

    if (this.shouldEnableSliding()) {
      if (deltaX > threshold) {
        this.nextSlide();
      } else if (deltaX < -threshold) {
        this.prevSlide();
      } else {
        this.startAutoSlide();
      }
    }

    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  isHalfWidget(): boolean {
    return this.data?.details.type === 'half';
  }

  getTotalDots(): number[] {
    if (this.isHalfWidget()) {
      return Array(Math.ceil(this.items.length / 2)).fill(0).map((_, i) => i);
    } else {
      return Array(this.items.length).fill(0).map((_, i) => i);
    }
  }

  getHalfWidgetPair(index: number): { first: number, second: number } {
    const baseIndex = (index * 2) % this.items.length;
    const secondIndex = (baseIndex + 1) % this.items.length;
    return { first: baseIndex, second: secondIndex };
  }

  getCurrentSlideIndex(): number {
    if (this.currentIndex === 0) return this.items.length - 1;
    if (this.currentIndex === this.items.length + 1) return 0;
    return this.currentIndex - 1;
  }

  getCachedImageUrl(index: number): string {
    const originalUrl = this.items[index];
    if (!originalUrl) return '';
    
    if (this.cachedImageUrls.has(originalUrl)) {
      return this.cachedImageUrls.get(originalUrl) || originalUrl;
    }
    
    return originalUrl;
  }

  getLottieUrl(index: number): string {
    if (!this.data?.details.widget_images || index >= this.data.details.widget_images.length) {
      return '';
    }
    return this.data.details.widget_images[index].lottie_data || '';
  }
  shouldShowWidget(): boolean {
    return !this.data?.position || this.data.position === this.position;
  }

  shouldEnableSliding(): boolean {
    if (!this.data?.details?.widget_images) return false;
    
    if (this.data.details.type === 'full') {
      return this.data.details.widget_images.length > 1;
    } else if (this.data.details.type === 'half') {
      return this.data.details.widget_images.length > 2;
    }
    
    return false;
  }
}