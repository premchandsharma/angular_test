import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReelFullScreenComponent } from './reel-full-screen.component';

describe('ReelFullScreenComponent', () => {
  let component: ReelFullScreenComponent;
  let fixture: ComponentFixture<ReelFullScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReelFullScreenComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ReelFullScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
