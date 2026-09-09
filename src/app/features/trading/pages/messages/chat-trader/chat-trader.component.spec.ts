import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatTraderComponent } from './chat-trader.component';

describe('ChatTraderComponent', () => {
  let component: ChatTraderComponent;
  let fixture: ComponentFixture<ChatTraderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChatTraderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatTraderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
