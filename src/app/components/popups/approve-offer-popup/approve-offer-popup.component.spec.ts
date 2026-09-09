import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApproveOfferPopupComponent } from './approve-offer-popup.component';

describe('ApproveOfferPopupComponent', () => {
  let component: ApproveOfferPopupComponent;
  let fixture: ComponentFixture<ApproveOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApproveOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApproveOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
