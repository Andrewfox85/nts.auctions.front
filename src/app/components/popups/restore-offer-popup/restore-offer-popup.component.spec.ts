import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreOfferPopupComponent } from './restore-offer-popup.component';

describe('RestoreOfferPopupComponent', () => {
  let component: RestoreOfferPopupComponent;
  let fixture: ComponentFixture<RestoreOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestoreOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestoreOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
