import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryScheduleEditComponent } from './delivery-schedule-edit.component';

describe('DeliveryScheduleEditComponent', () => {
  let component: DeliveryScheduleEditComponent;
  let fixture: ComponentFixture<DeliveryScheduleEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryScheduleEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryScheduleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
