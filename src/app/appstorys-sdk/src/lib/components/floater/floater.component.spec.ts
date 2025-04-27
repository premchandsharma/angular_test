import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FloaterComponent } from './floater.component';

describe('BannerComponent', () => {
  let component: FloaterComponent;
  let fixture: ComponentFixture<FloaterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloaterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FloaterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
