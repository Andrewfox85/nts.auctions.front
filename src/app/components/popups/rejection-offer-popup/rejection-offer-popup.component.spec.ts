import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectionOfferPopupComponent } from './rejection-offer-popup.component';

describe('RejectionOfferPopupComponent', () => {
  let component: RejectionOfferPopupComponent;
  let fixture: ComponentFixture<RejectionOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RejectionOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectionOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
