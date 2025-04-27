import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlideScreenNewComponent } from './story-full-screen.component';

describe('SlideScreenNewComponent', () => {
  let component: SlideScreenNewComponent;
  let fixture: ComponentFixture<SlideScreenNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideScreenNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SlideScreenNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
