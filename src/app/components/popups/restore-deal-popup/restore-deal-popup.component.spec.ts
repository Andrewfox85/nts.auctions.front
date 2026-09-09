import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreDealPopupComponent } from './restore-deal-popup.component';

describe('RestoreDealPopupComponent', () => {
  let component: RestoreDealPopupComponent;
  let fixture: ComponentFixture<RestoreDealPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RestoreDealPopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestoreDealPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
