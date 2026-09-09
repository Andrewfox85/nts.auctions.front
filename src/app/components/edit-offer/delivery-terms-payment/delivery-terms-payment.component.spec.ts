import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryTermsPaymentComponent } from './delivery-terms-payment.component';

describe('DeliveryTermsPaymentComponent', () => {
  let component: DeliveryTermsPaymentComponent;
  let fixture: ComponentFixture<DeliveryTermsPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeliveryTermsPaymentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryTermsPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
