import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReelsDetails } from '../reels/reels.component';
import { TrackUserActionService } from '../../../public-api';
import { ActionType } from '../../types/action.types';

@Component({
  selector: 'app-reel-full-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reel-full-screen.component.html',
  styleUrls: ['./reel-full-screen.component.css']
})
export class ReelFullScreenComponent implements OnInit {
  @Input() userId!: string;
  @Input() reelsCampaignId!: string;
  @Input() reelsDetails!: ReelsDetails;
  @Input() startIndex = 0;
  @Output() close = new EventEmitter<void>();

  currentIndex = 0;

  private touchStartY: number = 0;
  private touchEndY: number = 0;
  private swipeThreshold = 50;

  likedReels: boolean[] = [];

  constructor(private userActionTrackService: TrackUserActionService) { }
  ngOnInit() {
    this.currentIndex = this.startIndex;
    this.trackImpression(this.currentIndex);
    this.likedReels = new Array(this.reelsDetails.reels.length).fill(false);

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
  }

  toggleLike(index: number) {
    this.likedReels[index] = !this.likedReels[index];
  }

  navigateUp() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.trackImpression(this.currentIndex);
    }
  }

  navigateDown() {
    if (this.currentIndex < this.reelsDetails.reels.length - 1) {
      this.currentIndex++;
      this.trackImpression(this.currentIndex);
    }
  }

  async trackImpression(index: number) {
    try {
      await this.userActionTrackService.trackUserAction(
        this.userId,
        this.reelsCampaignId,
        ActionType.IMPRESSION,
        undefined,
        undefined,
        this.reelsDetails.reels[index].id,
      );
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  }

  async sendClick(link: string) {
    try {

      if (!link) return;
      await this.userActionTrackService.trackUserAction(
        this.userId,
        this.reelsCampaignId,
        ActionType.CLICK,
        undefined,
        undefined,
        this.reelsDetails.reels[this.currentIndex].id,
      );
        window.open(link, '_blank');
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
        await navigator.share(shareData);
      } else {
        console.warn('Web Share API not supported in this browser');
      }
    } catch (error) {
      console.error('Error sharing content:', error);
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.touchStartY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.touchEndY = event.changedTouches[0].clientY;
    this.handleVerticalSwipe();
  }

  private handleVerticalSwipe() {
    const swipeDistance = this.touchEndY - this.touchStartY;

    if (Math.abs(swipeDistance) > this.swipeThreshold) {
      if (swipeDistance > 0) {
        this.navigateUp();
      } else {
        this.navigateDown();
      }
    }
  }
}