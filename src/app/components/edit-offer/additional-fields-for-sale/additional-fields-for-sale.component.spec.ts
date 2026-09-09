import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalFieldsForSaleComponent } from './additional-fields-for-sale.component';

describe('AdditionalFieldsForSaleComponent', () => {
  let component: AdditionalFieldsForSaleComponent;
  let fixture: ComponentFixture<AdditionalFieldsForSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalFieldsForSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdditionalFieldsForSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
