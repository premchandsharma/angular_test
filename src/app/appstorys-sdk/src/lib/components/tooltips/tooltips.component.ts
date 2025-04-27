import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, Renderer2 } from '@angular/core';
import { CAMPAIGN_TYPES, CampaignData, MediaCampaign } from '../../interfaces/campaign';

export interface CampaignTooltips {
  id: string;
  campaignType: string;
  details: TooltipDetails;
}

export interface TooltipDetails {
  id: string;
  campaign: string;
  tooltips: Tooltip[];
}

export interface Tooltip {
  type: string;
  url: string;
  link?: string;
  target: string;
  position?: string;
  order: number;
  styling: TooltipStyling;
  clickAction?: string;
  id: string;
}

export interface TooltipStyling {
  tooltipDimensions: TooltipDimensions;
  highlightRadius: string;
  highlightPadding: string;
  backgroundColor: string;
  enableBackdrop: boolean;
  tooltipArrow: TooltipArrow;
  // spacing?: TooltipSpacing; // Uncomment when implemented
  closeButton: boolean;
}

export interface TooltipDimensions {
  height: string;
  width: string;
  cornerRadius: string;
}

export interface TooltipArrow {
  arrowHeight: string;
  arrowWidth: string;
}


@Component({
  selector: 'app-tooltips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltips.component.html',
  styleUrl: './tooltips.component.css'
})
export class TooltipsComponent implements OnInit, AfterViewInit {

  @Input() campaignData?: CampaignData | null;
  campaigns: any[] = [];
  userId: string | undefined;
  tooltipDetails?: TooltipDetails;

  data?: MediaCampaign;

  @Input() tooltipText: string = '';
  tooltipImage: string = '';
  showTooltip: boolean = false;
  position: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  @Input() target: string = '';

  // Store the original position to know the preferred position
  private originalPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  // Track if position was adjusted
  public adjustedPosition: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  // Track arrow position for custom positioning
  public arrowLeft: string | null = null;
  public arrowTop: string | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngOnInit(): void {
    this.originalPosition = this.position;
    this.adjustedPosition = this.position;
    this.initializeTooltips();
  }

  private initializeTooltips() {
    this.campaigns = this.campaignData!.campaigns;
    // console.log('Tooltip Details:', this.campaigns);
    if (!this.campaignData) return;

    const tooltipsCampaign = this.campaigns.find(
      campaign => campaign.campaign_type === 'TTP'
    );

    if (tooltipsCampaign) {
      this.data = tooltipsCampaign;
      this.tooltipDetails = tooltipsCampaign.details;
      this.userId = this.campaignData?.user_id;
      if (
        tooltipsCampaign?.details &&
        Array.isArray(tooltipsCampaign.details.tooltips) &&
        tooltipsCampaign.details.tooltips.length > 0
      ) {
        this.tooltipDetails = tooltipsCampaign.details;

        // Find tooltip that matches the input target
        const matchedTooltip = tooltipsCampaign.details.tooltips.find(
          (tooltip: Tooltip) => tooltip.target === this.target
        );

        if (matchedTooltip) {
          this.tooltipImage = matchedTooltip.url;

          // Use the position from the tooltip definition if provided
          if (matchedTooltip.position) {
            this.position = matchedTooltip.position as any;
            this.originalPosition = matchedTooltip.position as any;
            this.adjustedPosition = matchedTooltip.position as any;
          }

          this.showTooltip = true;
          setTimeout(() => this.adjustTooltipPosition(), 0);
        }
      }

      console.log('Tooltip Details:', this.tooltipDetails);

    }
  }

  ngAfterViewInit() {
    // Initial position check when tooltip is shown
    if (this.showTooltip) {
      setTimeout(() => this.adjustTooltipPosition(), 0);
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.showTooltip) {
      this.adjustTooltipPosition();
    }
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const tooltipBox = this.el.nativeElement.querySelector('.tooltip-box');
    if (this.showTooltip && tooltipBox && !tooltipBox.contains(event.target as Node)) {
      this.showTooltip = false;
    }
  }
  
  handleTooltipClick() {
    if (!this.tooltipDetails || !this.tooltipDetails.tooltips) return;
  
    const matchedTooltip = this.tooltipDetails.tooltips.find(
      tooltip => tooltip.target === this.target
    );
  
    if (matchedTooltip) {
      if (matchedTooltip.clickAction === 'deepLink' && matchedTooltip.link) {
        window.open(matchedTooltip.link, '_blank');
      } else {
        this.showTooltip = false;
      }
    }
  }
  

  // Watch for changes to showTooltip
  ngOnChanges() {
    if (this.showTooltip) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => this.adjustTooltipPosition(), 0);
    }
  }

  private adjustTooltipPosition() {
    const tooltipContainer = this.el.nativeElement;
    const tooltipContent = tooltipContainer.querySelector('.tooltip-content');
    const tooltipBox = tooltipContainer.querySelector('.tooltip-box');

    if (!tooltipBox || !tooltipContent) return;

    // Reset to original position first
    this.position = this.originalPosition;
    this.adjustedPosition = this.originalPosition;
    this.arrowLeft = null;
    this.arrowTop = null;

    // Get element positions and dimensions
    const containerRect = tooltipContainer.getBoundingClientRect();
    const contentRect = tooltipContent.getBoundingClientRect();
    const tooltipRect = tooltipBox.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center point of the content
    const contentCenterX = contentRect.left + contentRect.width / 2;
    const contentCenterY = contentRect.top + contentRect.height / 2;

    // Check bounds and adjust position if needed
    switch (this.position) {
      case 'top':
        // If tooltip would go above viewport
        if (contentRect.top - tooltipRect.height - 12 < 0) {
          this.adjustedPosition = 'bottom';
        }
        // If tooltip would go outside horizontally
        this.adjustHorizontalPosition(tooltipBox, contentCenterX, tooltipRect.width, viewportWidth);
        break;

      case 'bottom':
        // If tooltip would go below viewport
        if (contentRect.bottom + tooltipRect.height + 12 > viewportHeight) {
          this.adjustedPosition = 'top';
        }
        // If tooltip would go outside horizontally
        this.adjustHorizontalPosition(tooltipBox, contentCenterX, tooltipRect.width, viewportWidth);
        break;

      case 'left':
        // If tooltip would go beyond left edge
        if (contentRect.left - tooltipRect.width - 12 < 0) {
          this.adjustedPosition = 'right';
        }
        // If tooltip would go outside vertically
        this.adjustVerticalPosition(tooltipBox, contentCenterY, tooltipRect.height, viewportHeight);
        break;

      case 'right':
        // If tooltip would go beyond right edge
        if (contentRect.right + tooltipRect.width + 12 > viewportWidth) {
          this.adjustedPosition = 'left';
        }
        // If tooltip would go outside vertically
        this.adjustVerticalPosition(tooltipBox, contentCenterY, tooltipRect.height, viewportHeight);
        break;
    }

    // After adjusting the position, we may need to force update
    this.renderer.removeClass(tooltipBox, `tooltip-${this.position}`);
    this.renderer.addClass(tooltipBox, `tooltip-${this.adjustedPosition}`);

    // Re-check after position adjustment (some cases may need secondary adjustment)
    setTimeout(() => {
      const updatedTooltipRect = tooltipBox.getBoundingClientRect();

      // Additional bounds checking
      this.finalPositionAdjustment(tooltipBox, updatedTooltipRect, viewportWidth, viewportHeight, contentRect);
    }, 0);
  }

  private adjustHorizontalPosition(tooltipBox: HTMLElement, contentCenterX: number, tooltipWidth: number, viewportWidth: number) {
    // Calculate left edge of tooltip if centered
    const tooltipLeft = contentCenterX - tooltipWidth / 2;

    // Check if tooltip would go beyond left edge
    if (tooltipLeft < 10) {
      // Set tooltip 10px from left edge
      this.renderer.setStyle(tooltipBox, 'left', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateX(0)');

      // Adjust arrow position
      const arrowLeft = contentCenterX - 10; // 10px is our left margin
      this.arrowLeft = `${arrowLeft}px`;
    }
    // Check if tooltip would go beyond right edge
    else if (tooltipLeft + tooltipWidth > viewportWidth - 10) {
      // Set tooltip 10px from right edge
      this.renderer.setStyle(tooltipBox, 'left', 'auto');
      this.renderer.setStyle(tooltipBox, 'right', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateX(0)');

      // Adjust arrow position
      const rightEdge = viewportWidth - 10;
      const arrowLeft = contentCenterX - (rightEdge - tooltipWidth);
      this.arrowLeft = `${arrowLeft}px`;
    }
  }

  private adjustVerticalPosition(tooltipBox: HTMLElement, contentCenterY: number, tooltipHeight: number, viewportHeight: number) {
    // Calculate top edge of tooltip if centered
    const tooltipTop = contentCenterY - tooltipHeight / 2;

    // Check if tooltip would go beyond top edge
    if (tooltipTop < 10) {
      // Set tooltip 10px from top edge
      this.renderer.setStyle(tooltipBox, 'top', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateY(0)');

      // Adjust arrow position
      const arrowTop = contentCenterY - 10; // 10px is our top margin
      this.arrowTop = `${arrowTop}px`;
    }
    // Check if tooltip would go beyond bottom edge
    else if (tooltipTop + tooltipHeight > viewportHeight - 10) {
      // Set tooltip 10px from bottom edge
      this.renderer.setStyle(tooltipBox, 'top', 'auto');
      this.renderer.setStyle(tooltipBox, 'bottom', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateY(0)');

      // Adjust arrow position
      const bottomEdge = viewportHeight - 10;
      const arrowTop = contentCenterY - (bottomEdge - tooltipHeight);
      this.arrowTop = `${arrowTop}px`;
    }
  }

  private finalPositionAdjustment(
    tooltipBox: HTMLElement,
    tooltipRect: DOMRect,
    viewportWidth: number,
    viewportHeight: number,
    contentRect: DOMRect
  ) {
    // Final check for any remaining overflow issues
    if (tooltipRect.left < 10) {
      this.renderer.setStyle(tooltipBox, 'left', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateX(0)');
    }

    if (tooltipRect.right > viewportWidth - 10) {
      this.renderer.setStyle(tooltipBox, 'left', 'auto');
      this.renderer.setStyle(tooltipBox, 'right', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateX(0)');
    }

    if (tooltipRect.top < 10) {
      this.renderer.setStyle(tooltipBox, 'top', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateY(0)');
    }

    if (tooltipRect.bottom > viewportHeight - 10) {
      this.renderer.setStyle(tooltipBox, 'top', 'auto');
      this.renderer.setStyle(tooltipBox, 'bottom', '10px');
      this.renderer.setStyle(tooltipBox, 'transform', 'translateY(0)');
    }
  }
}