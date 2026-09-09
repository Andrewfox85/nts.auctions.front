import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalPurchaseFieldsComponent } from './additional-purchase-fields.component';

describe('AdditionalPurchaseFieldsComponent', () => {
  let component: AdditionalPurchaseFieldsComponent;
  let fixture: ComponentFixture<AdditionalPurchaseFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalPurchaseFieldsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalPurchaseFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
