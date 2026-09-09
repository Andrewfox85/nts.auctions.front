import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptCounterofferToSellComponent } from './accept-counteroffer-to-sell.component';

describe('AcceptCounterofferToSellComponent', () => {
  let component: AcceptCounterofferToSellComponent;
  let fixture: ComponentFixture<AcceptCounterofferToSellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcceptCounterofferToSellComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcceptCounterofferToSellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
