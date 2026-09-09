import { IBucePriceStepsBody } from '@services';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { DX_MODULES, pricingType, IdInterfaceField, NO_BASIS, PRICE_ADJUSTMENT_TYPE } from '@constants';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '@classes';
import { SummaryFormatterService, ToastService, TraderService } from '@services';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { RuNumberFormatPipe, ToNumberPipe } from '@pipes';
import { DxNumberBoxTypes } from 'devextreme-angular/ui/number-box';
import { EMTY_STEP_PRICE, MINIMUM_STEP_PRICE } from '../../../shared/constants';
import { DxGridContextMenuLocalizationDirective } from '../../../shared/directives';
import { DisableNumberBoxWheel } from "../../../shared/directives/disable-number-box-wheel";
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-edit-price-step-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    ToNumberPipe,
    RuNumberFormatPipe,
    DxGridContextMenuLocalizationDirective,
    DisableNumberBoxWheel
  ],
  templateUrl: './edit-price-step-popup.component.html',
  styleUrls: ['./edit-price-step-popup.component.scss'],
})
export class EditPriceStepPopupComponent implements OnInit {
  private readonly traderService = inject(TraderService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly translate = inject(TranslateService);
  public readonly summaryFormatterService = inject(SummaryFormatterService);

  @Input() sessionIds;
  @Input() editPriceStepPopup;
  @Input() data;
  @Output() close = new EventEmitter<any>();

  public user: User;
  public dataForDisplay;
  public priceStep;
  public pricingType = pricingType;
  public stepForm = this.formBuilder.group({});
  public readonly IdInterfaceField = IdInterfaceField;
  public readonly NO_BASIS = NO_BASIS;
  public readonly PRICE_ADJUSTMENT_TYPE = PRICE_ADJUSTMENT_TYPE;

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  onShowing(e): void {
    this.dataForDisplay = this.data;
    //формируем форму для поля шага цены
    this.dataForDisplay.goods.forEach((good) => {
      good.goodsSpecifications.forEach((field) => {
        if (field.idInterfaceField === IdInterfaceField.priceStep) {
          this.stepForm.addControl(
            good.idGood ? good.idGood.toString() : '',
            this.formBuilder.control(null, [
              Validators.required,
              Validators.min(0.01),
            ])
          );
          this.stepForm.controls[
            good.idGood ? good.idGood.toString() : ''
          ].patchValue(
            this.getValueNumber(
              good.goodsSpecifications,
              field.idInterfaceField
            )
          );
        }
      });
    });
  }

  getValue(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValue;
  }

  getValueNumber(goodsSpecifications, idInterfaceField) {
    return goodsSpecifications.find(
      (el) => el.idInterfaceField == idInterfaceField
    )?.fieldValueNumber;
  }

  zeroComparison = (): number => 0;

  setReadForm(e: DxNumberBoxTypes.ValueChangedEvent, goodId: number): void {
    if (e.event) {
      let valueToPatch = e.value;
      const numericValue = parseFloat(valueToPatch);
      if (!isNaN(numericValue) && numericValue === EMTY_STEP_PRICE) {
        valueToPatch = MINIMUM_STEP_PRICE;
      }
      this.stepForm.controls[goodId ? goodId.toString() : ''].patchValue(
        valueToPatch
      );
    }
  }

  editPriceStep(): void {
    const listGoods: number[] = this.dataForDisplay.goods
      .sort((a, b) => a.idGood - b.idGood)
      .flatMap((item) => {
        const id = item.goodsSpecifications[0]?.idDemandOfferGood;
        return id !== undefined ? [id] : [];
      });

    const listPrices: number[] = Object.values(this.stepForm.value);

    const body: IBucePriceStepsBody = {
      idSection: this.sessionIds.sectionId,
      idSession: this.sessionIds.sessionId,
      idDirection: this.dataForDisplay.idDirection,
      idDemandOffer: this.dataForDisplay.idDemandOffer,
      listGoods,
      listPrices,
    };

    this.traderService.bucePriceSteps(this.user?.token, body).subscribe(() => {
      let message = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.offersTable.priceStepMess');
      this.toastService.onShowToast({ message: message, type: 'success' });
      this.closePopup();
    });
  }

  closePopup(): void {
    this.dataForDisplay.goods.forEach((good) => {
      good.goodsSpecifications.forEach((field) => {
        if (field.idInterfaceField === IdInterfaceField.priceStep) {
          this.stepForm.removeControl(
            good.idGood ? good.idGood.toString() : ''
          );
        }
      });
    });

    this.close.emit(false);
  }
}
