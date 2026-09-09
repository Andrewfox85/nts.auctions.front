import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareMainInfoComponent } from './compare-main-info.component';

describe('CompareMainInfoComponent', () => {
  let component: CompareMainInfoComponent;
  let fixture: ComponentFixture<CompareMainInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompareMainInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompareMainInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
