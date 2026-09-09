import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryScopeComponent } from './delivery-scope.component';

describe('DeliveryScopeComponent', () => {
  let component: DeliveryScopeComponent;
  let fixture: ComponentFixture<DeliveryScopeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryScopeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryScopeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
