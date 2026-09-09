import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RulesForEditingComponent } from './rules-for-editing.component';

describe('RulesForEditingComponent', () => {
  let component: RulesForEditingComponent;
  let fixture: ComponentFixture<RulesForEditingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RulesForEditingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RulesForEditingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
