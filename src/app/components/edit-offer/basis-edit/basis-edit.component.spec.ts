import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasisEditComponent } from './basis-edit.component';

describe('BasisEditComponent', () => {
  let component: BasisEditComponent;
  let fixture: ComponentFixture<BasisEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasisEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasisEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
