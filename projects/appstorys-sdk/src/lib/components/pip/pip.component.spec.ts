import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PipComponent } from './pip.component';

describe('PipComponent', () => {
  let component: PipComponent;
  let fixture: ComponentFixture<PipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
