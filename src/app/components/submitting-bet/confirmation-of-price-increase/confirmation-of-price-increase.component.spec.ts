import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmationOfPriceIncreaseComponent } from './confirmation-of-price-increase.component';

describe('ConfirmationOfPriceIncreaseComponent', () => {
  let component: ConfirmationOfPriceIncreaseComponent;
  let fixture: ComponentFixture<ConfirmationOfPriceIncreaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationOfPriceIncreaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmationOfPriceIncreaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
