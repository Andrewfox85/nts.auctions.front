import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteOfferPopupComponent } from './delete-offer-popup.component';

describe('DeleteOfferPopupComponent', () => {
  let component: DeleteOfferPopupComponent;
  let fixture: ComponentFixture<DeleteOfferPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeleteOfferPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeleteOfferPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
