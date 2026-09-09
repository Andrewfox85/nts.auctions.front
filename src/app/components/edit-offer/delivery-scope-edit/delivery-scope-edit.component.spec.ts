import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryScopeEditComponent } from './delivery-scope-edit.component';

describe('DeliveryScopeEditComponent', () => {
  let component: DeliveryScopeEditComponent;
  let fixture: ComponentFixture<DeliveryScopeEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeliveryScopeEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliveryScopeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
