import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckActivationModeComponent } from './check-activation-mode.component';

describe('CheckActivationModeComponent', () => {
  let component: CheckActivationModeComponent;
  let fixture: ComponentFixture<CheckActivationModeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckActivationModeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckActivationModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
