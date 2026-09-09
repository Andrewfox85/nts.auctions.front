import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmittingBetComponent } from './submitting-bet.component';

describe('SubmittingBetComponent', () => {
  let component: SubmittingBetComponent;
  let fixture: ComponentFixture<SubmittingBetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubmittingBetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmittingBetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
