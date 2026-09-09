import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolumePopupComponent } from './volume-popup.component';

describe('VolumePopupComponent', () => {
  let component: VolumePopupComponent;
  let fixture: ComponentFixture<VolumePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VolumePopupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VolumePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
