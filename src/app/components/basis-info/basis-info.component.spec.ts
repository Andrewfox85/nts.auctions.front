import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasisInfoComponent } from './basis-info.component';

describe('BasisInfoComponent', () => {
  let component: BasisInfoComponent;
  let fixture: ComponentFixture<BasisInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BasisInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasisInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
