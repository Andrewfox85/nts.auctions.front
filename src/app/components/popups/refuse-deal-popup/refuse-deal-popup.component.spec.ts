import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { TransactionService } from '@services';
import { RefuseDealPopupComponent } from './refuse-deal-popup.component';

describe('RefuseDealPopupComponent', () => {
  let component: RefuseDealPopupComponent;
  let fixture: ComponentFixture<RefuseDealPopupComponent>;
  let transactionService: jasmine.SpyObj<TransactionService>;

  beforeEach(async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ token: 'test-token', IsWorker: true })
    );

    transactionService = jasmine.createSpyObj('TransactionService', [
      'transactionTerminate',
      'triggerEdit',
    ]);
    transactionService.transactionTerminate.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [RefuseDealPopupComponent, TranslateModule.forRoot()],
      providers: [
        { provide: TransactionService, useValue: transactionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RefuseDealPopupComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('refusePopup', true);
    fixture.componentRef.setInput('choosenDeals', [
      {
        idTransaction: 42,
        transactionInfo: { transactionNumber: 'D-42' },
      },
    ]);
    fixture.componentRef.setInput('sessionIds', {
      sectionId: '1',
      sessionId: '2',
    });
    fixture.detectChanges();
  });

  it('should refresh deals grid immediately after successful termination', fakeAsync(() => {
    const closeResSpy = jasmine.createSpy('closeRes');
    component.closeRes.subscribe(closeResSpy);
    component.refuseForm.patchValue({ reason: 'test reason' });

    component.refuseDeal();
    flush();

    expect(transactionService.triggerEdit).toHaveBeenCalled();
    expect(component.resultPopup()).toBe(true);
    expect(component.dealNumberForRes).toEqual({ dealNumber: 'D-42' });
    expect(closeResSpy).not.toHaveBeenCalled();
  }));

  it('should emit closeRes only when the result popup is closed', () => {
    const closeResSpy = jasmine.createSpy('closeRes');
    component.closeRes.subscribe(closeResSpy);
    component.resultPopup.set(true);

    component.closeResultPopup();

    expect(component.resultPopup()).toBe(false);
    expect(closeResSpy).toHaveBeenCalledWith(false);
  });
});
