import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter, HostListener, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackUserActionService } from '../../utils/track-user-action.service';
import { ActionType } from '../../types/action.types';

@Component({
  selector: 'app-slide-screen-new',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-full-screen.component.html',
  styleUrls: ['./story-full-screen.component.css']
})
export class SlideScreenNewComponent implements OnInit, OnDestroy {
  @Input() data: any;
  @Input() index!: number;
  @Input() storyCampaignId!: string;
  @Input() userId!: string;
  @Output() slideScreenVisibleChange = new EventEmitter<boolean>();
  @ViewChild('videoElement') videoElementRef!: ElementRef<HTMLVideoElement>;

  content: any[] = [];
  current = 0;
  currentGroupIndex!: number;
  progress = 0;
  isPaused = false;
  isContentReady = false;
  currentDuration = 5000;

  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private longPressTimer: any;
  private swipeThreshold: number = 50;
  private tapTimeThreshold: number = 300;
  private tapPositionThreshold: number = 0.3;

  private animationFrameId: number | null = null;
  private startTime: number | null = null;
  private elapsed = 0;
  private videoElement: HTMLVideoElement | null = null;
  private videoEventListeners: (() => void)[] = [];

  constructor(private userActionTrackService: TrackUserActionService) {}

  ngOnInit() {
    this.currentGroupIndex = this.index;
    this.initializeContent();
    this.isPaused = false;
  }

  initializeContent() {
    if (this.data?.details[this.currentGroupIndex]?.slides) {
      this.content = this.data.details[this.currentGroupIndex].slides.map(
        (slide: any) => ({ ...slide, finish: 0 })
      );
    }
  }

  startProgress(duration: number) {
    if (!this.isContentReady) return;

    this.startTime = performance.now();

    const animate = (timestamp: number) => {
      if (this.isPaused) return;

      if (!this.startTime) {
        this.startTime = timestamp;
      }

      const elapsed = timestamp - this.startTime + this.elapsed;
      const progressValue = Math.min((elapsed / duration) * 100, 100);
      this.progress = progressValue;

      if (progressValue < 100) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.handleNext();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.elapsed += performance.now() - (this.startTime || 0);
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      
      if (this.content[this.current]?.video && this.videoElementRef) {
        this.videoElementRef.nativeElement.pause();
      }
    } else {
      this.startTime = performance.now();
      
      if (this.content[this.current]?.video && this.videoElementRef) {
        this.videoElementRef.nativeElement.play().catch(err => {
          console.error('Error playing video:', err);
        });
      }
      
      this.startProgress(this.currentDuration);
    }
  }

  handleNext() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.elapsed = 0;
    this.progress = 0;
    
    if (this.videoElementRef && this.content[this.current]?.video) {
      this.cleanupVideoListeners();
      this.videoElementRef.nativeElement.pause();
      this.videoElementRef.nativeElement.currentTime = 0;
      this.videoElement = null;
    }

    if (this.current < this.content.length - 1) {
      this.content[this.current].finish = 1;
      this.current++;
      this.isContentReady = false;
      this.isPaused = false;
    } else if (this.currentGroupIndex < this.data.details.length - 1) {
      this.currentGroupIndex++;
      this.current = 0;
      this.initializeContent();
      this.isContentReady = false;
      this.isPaused = false;
    } else {
      this.close();
    }
  }

  handlePrevious() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.elapsed = 0;
    this.progress = 0;
    
    if (this.videoElementRef && this.content[this.current]?.video) {
      this.cleanupVideoListeners();
      this.videoElementRef.nativeElement.pause();
      this.videoElementRef.nativeElement.currentTime = 0;
      this.videoElement = null;
    }

    if (this.current > 0) {
      this.content[this.current].finish = 0;
      this.current--;
      this.isContentReady = false;
      this.isPaused = false;
    } else if (this.currentGroupIndex > 0) {
      this.currentGroupIndex--;
      const prevGroupSlides = this.data.details[this.currentGroupIndex].slides;
      this.content = prevGroupSlides.map((slide: any) => ({ ...slide, finish: 0 }));
      this.current = prevGroupSlides.length - 1;
      this.isContentReady = false;
      this.isPaused = false;
    }
  }

  close() {
    this.slideScreenVisibleChange.emit(false);
  }

  onImageLoaded() {
    this.isContentReady = true;
    this.currentDuration = 5000;
    this.trackImpression();
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.videoElement = video;
    this.currentDuration = video.duration * 1000;
    this.isContentReady = true;
    
    this.cleanupVideoListeners();
    
    const pauseListener = () => {
      if (!this.isPaused) {
        this.isPaused = true;
        this.elapsed += performance.now() - (this.startTime || 0);
        if (this.animationFrameId) {
          cancelAnimationFrame(this.animationFrameId);
        }
      }
    };
    
    const playListener = () => {
      if (this.isPaused) {
        this.isPaused = false;
        this.startTime = performance.now();
        this.startProgress(this.currentDuration);
      }
    };
    
    video.addEventListener('pause', pauseListener);
    video.addEventListener('play', playListener);
    
    this.videoEventListeners = [
      () => video.removeEventListener('pause', pauseListener),
      () => video.removeEventListener('play', playListener)
    ];
    
    video.play().catch(err => {
      console.error('Error playing video:', err);
    });
    
    this.trackImpression();
  }

  cleanupVideoListeners() {
    this.videoEventListeners.forEach(removeListener => removeListener());
    this.videoEventListeners = [];
  }

  async trackImpression() {
    try {
      await this.userActionTrackService.trackUserAction(
        this.userId,
        this.storyCampaignId,
        ActionType.IMPRESSION,
        this.content[this.current].id
      );
      this.startProgress(this.currentDuration);
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async sendClick() {
    try {
      await this.userActionTrackService.trackUserAction(
        this.userId,
        this.storyCampaignId,
        ActionType.CLICK,
        this.content[this.current].id
      );
      this.startProgress(this.currentDuration);
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async share(url: string) {
    try {
      if (navigator.share) {
        const shareData: ShareData = {
          title: 'Check out this link!',
          url: url || window.location.href
        };
        
        const wasPaused = this.isPaused;
        if (!wasPaused) {
          this.togglePause();
        }
        
        await navigator.share(shareData);
        
        if (!wasPaused) {
          this.togglePause();
        }
      } else {
        console.warn('Web Share API not supported in this browser');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
      this.touchStartTime = Date.now();
      
      this.longPressTimer = setTimeout(() => {
        this.togglePause();
      }, 500);
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (event.changedTouches.length === 1) {
      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;
      const touchEndTime = Date.now();
      
      const deltaX = touchEndX - this.touchStartX;
      const deltaTime = touchEndTime - this.touchStartTime;

    const screenHeight = window.innerHeight;
    const touchYPosition = this.touchStartY / screenHeight;
    
    if (touchYPosition < 0.2) {
      return;
    }
      
      if (Math.abs(deltaX) > this.swipeThreshold) {
        if (deltaX > 0) {
          this.handlePrevious();
        } else {
          this.handleNext();
        }
      } 
      else if (deltaTime < this.tapTimeThreshold) {
        const screenWidth = window.innerWidth;
        const tapPosition = this.touchStartX / screenWidth;
        
        if (tapPosition < this.tapPositionThreshold) {
          this.handlePrevious();
        } 
        else if (tapPosition > (1 - this.tapPositionThreshold)) {
          this.handleNext();
        } 
      }
    }
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.cleanupVideoListeners();
  }
}