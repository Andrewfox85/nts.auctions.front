import {
  Component,
  Input,
  signal,
  viewChild,
  output,
  inject,
  AfterViewInit,
} from '@angular/core';
import { User } from '@classes';
import { DX_MODULES, pricingType } from '@constants';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import RU from '@ru-translate';
import EN from '@en-translate';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of, switchMap, tap } from 'rxjs';
import {
  CommonService,
  TradingService,
  ToastService,
  CurrencyService,
  TransactionService,
} from '@services';
import { CommonModule } from '@angular/common';
import { downloadFile, getNumber, getVatNumber } from '@helpers';
import {
  TermsDealComponent,
  AdditionalInfoDealComponent,
  GoodsDealsComponent,
} from './components';
import { GlobalStore } from '@store';
import { HomePageStore } from '../../../views/homepage/store';
import {
  getPathDealsEditTranstaction,
  getPathDealsEdit,
  round,
  checkSameUnits
} from '@helpers';
import {
  BuyerDealDutchAuctionComponent,
  SalesmanDealDutchAuctionComponent,
} from '../../../views/dutch-down-auction/components';

import {
  BuyerDealEnglishAuctionComponent,
  SalesmanDealEnglishAuctionComponent,
} from '../../../views/english-upgrading-auction/components';
import {
  TransactionEditBuyer,
  TransactionEditSeller,
  TransactionEditSellerForm,
  TransactionEditBuyerForm,
} from '../../../services/transaction-service/shared';
import { AUCTION_TYPE } from '@enums';

@Component({
  selector: 'app-edit-deal',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    TermsDealComponent,
    BuyerDealEnglishAuctionComponent,
    SalesmanDealEnglishAuctionComponent,
    AdditionalInfoDealComponent,
    GoodsDealsComponent,
    BuyerDealDutchAuctionComponent,
    SalesmanDealDutchAuctionComponent,
  ],
  templateUrl: './edit-deal.component.html',
  styleUrls: ['./edit-deal.component.scss'],
})
export class EditDealComponent {
  private readonly currencyService = inject(CurrencyService);
  private readonly transactionService = inject(TransactionService);

  private user: User;
  @Input() sessionIds;

  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly globalStore = inject(GlobalStore);
  private readonly homePagestore = inject(HomePageStore);

  public readonly translate = inject(TranslateService);

  public readonly onClose = output<boolean>();

  public readonly buyerDealEnglishAuctionComponent =
    viewChild<BuyerDealEnglishAuctionComponent>('buyerDealEnglishAuction');
  public readonly sellerDealDutchAuctionComponent =
    viewChild<SalesmanDealDutchAuctionComponent>('sellerDealDutchAuction');

  public readonly offerGeneralHidden = signal(false);
  public readonly sellerInformationHidden = signal(false);
  public readonly buyerInformationHidden = signal(false);
  public readonly addInfo = signal(false);
  public readonly expandTable = signal(false);

  public readonly buyerDealEnglishAuctionInstance =
    this.buyerDealEnglishAuctionComponent();
  public readonly sellerDealDutchAuctionInstance =
    this.sellerDealDutchAuctionComponent();

  public readonly fullInfo = this.globalStore.fullInfo();

  public readonly idAuctionType = this.homePagestore.idAuctionType();

  public readonly AUCTION_TYPE = AUCTION_TYPE;

  public closeEditPopup = false;
  public goodInfo = false;

  public listClientBranch;
  public readonly getNumber = getNumber;
  public generalInfo: any;
  public goods: any;
  public documents: any;

  public pricingType = pricingType;

  public VatField: any; //Ставка НДС
  public currencyPrecision: any; //точность валюты
  public totalForm = this.formBuilder.group({
    vat: [],
    costWithoutVat: [],
    amountVAT: [],
    costVat: [],
    quantity: [],
  });

  public totalRowData: any; //инфа в строку Итого по товарам

  public infoForEdit: any; //массив с покупателем для изменения
  public disabledButton = true;

  public ngOnChanges(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.generalInfo = this.fullInfo?.transactionGeneral;
    this.goods = this.fullInfo?.goods;
    this.documents = this.fullInfo?.documents;
    this.getInfoForEdit();
    this.getPrecision();
  }

  public prepareGoods() {
    //добавляем в товары стоимость ндс/стоимость с/без ндс
    this.goods.forEach((good) => {
      this.VatField = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == 5
      ); //Ставка НДС
      good.isOpened = false; //для открытия подробного просмотра в таблице
      //ищем поля с мультивыбором, группируя по idInterfaceField
      let groupFields = good.goodsSpecifications.reduce(function (r, a) {
        //сгруппированы поля по idInterfaceField
        r[a.idInterfaceField] = r[a.idInterfaceField] || [];
        r[a.idInterfaceField].push(a);
        return r;
      }, {});
      //получаем idInterfaceField, по тем полям, где выбрано больше одного значения
      let idMultiFields = Object.keys(groupFields).filter(
        (key) => Array.isArray(groupFields[key]) && groupFields[key].length > 1
      );

      idMultiFields.forEach((id) => {
        for (let i = 1; i < groupFields[id]?.length; i++) {
          groupFields[id][0].fieldValue =
            groupFields[id][0].fieldValue +
            '; ' +
            groupFields[id][i].fieldValue; //формируем строку значений из всех выбранных значений по полю с мультивыбором
        }
        groupFields[id] = [groupFields[id][0]]; //из массива данных с одинаковым idInterfaceField, делаем одно поле, в котором fieldValue включает в себя все выбранные значения
      });
      good.goodsSpecifications = Object.values(groupFields).flat(); //массив с индивидуальными idInterfaceField

      if (
        this.generalInfo.pricingTypeId !=
        this.pricingType.formulaWithoutQuotation
      ) {
        // добавляем Стоимость (без НДС), Сумма НДС, Стоимость (с учетом НДС)
        let count = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField == 1)
            .fieldValueNumber
        ); //количество
        let priceWithoutVat = Number(
          good.goodsSpecifications.find((field) => field.idInterfaceField == 3)
            .fieldValueNumber
        ); //Цена без НДС
        let vat: number = getVatNumber(this.VatField);
        let costWithoutVAT = round(
          count * priceWithoutVat,
          this.currencyPrecision
        );
        let amountVAT = round(
          costWithoutVAT * (vat / 100),
          this.currencyPrecision
        );
        let costVAT = costWithoutVAT + amountVAT;

        good.goodsSpecifications.push(
          {
            costWithoutVAT: costWithoutVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.costNoVAT
                : EN['trading'].offersTable.costNoVAT,
            fieldValue: costWithoutVAT,
          },
          {
            amountVAT: amountVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.amountVAT
                : EN['trading'].offersTable.amountVAT,
            fieldValue: amountVAT,
          },
          {
            costVAT: costVAT,
            fieldName:
              this.translate.store.currentLang === 'RU'
                ? RU['trading'].offersTable.costVATShort
                : EN['trading'].offersTable.costVATShort,
            fieldValue: costVAT,
          }
        );
      }

      Object.assign(good, {
        currency: good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 4
        ).fieldValue,
      }); //добавляем каждому товару Валюта

      if (
        this.generalInfo.pricingTypeId == this.pricingType.formulaWithQuotation
      ) {
        let quoteCurrency = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 55
        ).fieldValue; //Валюта котировки
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 53
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, {
          quoteCurrency: quoteCurrency,
          priceAdjustment: priceAdjustment,
        });
      }
      if (
        this.generalInfo.pricingTypeId ==
        this.pricingType.formulaWithoutQuotation
      ) {
        let priceAdjustment = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 53
        ).fieldValueNumber; //Тип поправки
        Object.assign(good, { priceAdjustment: priceAdjustment });
      }
    });

    this.totalForm.controls.vat.patchValue(this.VatField.fieldValue); //Ставка НДС (%)

    if (this.onSameUnits) {
      //общее количество
      let volumeSum = 0,
        precision;
      this.goods.forEach((good) => {
        let volume = good.goodsSpecifications.find(
          (field) => field.idInterfaceField == 1
        );
        volumeSum = volumeSum + volume.fieldValueNumber;
        precision = volume.fieldPrecision;
      });
      this.totalForm.controls.quantity.patchValue(
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
          ' ' +
          this.goods[0].unitName
      );
    }
    this.setTotalCost();

    //получаем точность валюты
    if (this.generalInfo.pricingTypeId == pricingType.formulaWithQuotation) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          ).fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
        });
    }
  }

  public setTotalCost() {
    let costWithoutVatTotal = 0,
      amountVATTotal = 0,
      costVATTotal = 0;
    let vat: number = getVatNumber(this.VatField);
    if (this.generalInfo.pricingTypeId != pricingType.formulaWithoutQuotation) {
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          )?.fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
          this.goods.forEach((good) => {
            let count = Number(
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField == 1
              ).fieldValueNumber
            ); //количество
            let priceWithoutVat = Number(
              good.goodsSpecifications.find(
                (field) => field.idInterfaceField == 3
              ).fieldValueNumber
            ); //Цена без НДС

            let costWithoutVAT = round(
              count * priceWithoutVat,
              this.currencyPrecision
            );
            let amountVAT = round(
              costWithoutVAT * (vat / 100),
              this.currencyPrecision
            );
            let costVAT = costWithoutVAT + amountVAT;

            good.goodsSpecifications.forEach((item) => {
              if (item.costWithoutVAT) {
                item.costWithoutVAT = costWithoutVAT;
                item.fieldValue = costWithoutVAT;
              }
              if (item.amountVAT || item.amountVAT == 0) {
                item.amountVAT = amountVAT;
                item.fieldValue = amountVAT;
              }
              if (item.costVAT) {
                item.costVAT = costVAT;
                item.fieldValue = costVAT;
              }
            });

            costWithoutVatTotal = costWithoutVatTotal + costWithoutVAT;
            amountVATTotal = amountVATTotal + amountVAT;
            costVATTotal = costVATTotal + costVAT;
          });

          this.totalForm.controls.costWithoutVat.patchValue(
            Number(costWithoutVatTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );
          this.totalForm.controls.amountVAT.patchValue(
            Number(amountVATTotal).toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );
          this.totalForm.controls.costVat.patchValue(
            costVATTotal.toLocaleString('ru', {
              minimumFractionDigits: this.currencyPrecision,
              maximumFractionDigits: this.currencyPrecision,
            }) +
              ' ' +
              this.goods[0].currency
          );

          this.totalRowData = this.totalForm.value;
        });
    }
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  public downloadDoc(file): void {
    this.transactionService
      .getTransactDocContent(
        this.user?.token,
        this.sessionIds.sectionId,
        this.sessionIds.sessionId,
        this.generalInfo.idTransaction,
        file.idDocument
      )
      .subscribe((res) => {
        downloadFile(res.content, file.filename);
      });
  }

  public getInfoForEdit(): void {
    of(this.homePagestore.idAuctionType())
      .pipe(
        switchMap((type: number) =>
          this.transactionService.getEntityToTransactionEdit(
            this.user?.token,
            this.sessionIds.sectionId,
            this.sessionIds.sessionId,
            this.fullInfo.transactionGeneral.idTransaction,
            getPathDealsEditTranstaction(type)
          )
        ),
        tap((res: any) => {
          this.infoForEdit = res.buyersList || res.sellersList;

          if (this.homePagestore.idAuctionType() === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {

            //добавляем информацию о продавце, с которым сделка заключена
            const newElement = {
              idFirmClient: this.generalInfo.sellerInfo.sellerIdClient,
              concatedNameFirmClient: this.generalInfo.sellerInfo.sellerConcatedClientName,
              idBranch: this.generalInfo.sellerInfo.sellerIdBranch,
              nameBranch: this.generalInfo.sellerInfo.sellerBranchName
            };
            
            this.infoForEdit.unshift(newElement);
          }

          this.infoForEdit = this.infoForEdit.filter((part) =>
            Object.values(part).some((value) => value !== null)
          );
          this.listClientBranch = this.infoForEdit
            .filter((item: any) => item.idBranch !== null)
            .map(({ idBranch, nameBranch }: any) => ({
              idBranch,
              nameBranch,
            }));
          this.disabledButton = false;
        })
      )
      .subscribe();
  }

  public onChooseClient(e): void {
    this.listClientBranch = this.infoForEdit
      .filter((item) => item.idFirmClient === e && item.idBranch !== null)
      .map(({ idBranch, nameBranch }) => ({ idBranch, nameBranch }));
    this.disabledButton = false;
  }

  public changeVat(value: string): void {
    this.disabledButton = false;
  }

  public editDeal(): void {
    of(this.homePagestore.idAuctionType())
      .pipe(
        switchMap((type: number) =>
          this.transactionService.transactionsEdit(
            this.user?.token,
            this.processBody(),
            getPathDealsEdit(type)
          )
        ),
        tap(() => {
          let message =
            this.translate.store.currentLang == 'RU'
              ? RU['viewDeal'].successEditMess
              : EN['viewDeal'].successEditMess;
          this.toastService.onShowToast({ message: message, type: 'success' });
          this.transactionService.triggerEdit(); //обновляем грид сделок
          this.onClose.emit(true);
        })
      )
      .subscribe();
  }

  private processBody(): TransactionEditBuyer | TransactionEditSeller {
    return {
      idSection: parseInt(this.sessionIds.sectionId, 10),
      idSession: parseInt(this.sessionIds.sessionId, 10),
      idTransaction: parseInt(
        this.fullInfo.transactionGeneral.idTransaction,
        10
      ),
      ...this.proccessBodyFormValue(),
    };
  }

  private proccessBodyFormValue():
    | TransactionEditBuyerForm
    | TransactionEditSellerForm
    | null {
    const auctionType = this.homePagestore.idAuctionType();

    if (auctionType === AUCTION_TYPE.ENGLISH_UPGRADING_AUCTION) {
      return this.buildBuyerFormBody();
    }

    if (auctionType === AUCTION_TYPE.DUTCH_DOWN_AUCTION) {
      return this.buildSellerFormBody();
    }

    return null;
  }

  private buildBuyerFormBody(): TransactionEditBuyerForm {
    const component = this.buyerDealEnglishAuctionComponent();
    const formValue = component.editForm.getRawValue();
    const { buyerIdClientNew, buyerIdBranchNew, textReason } = formValue;

    return buyerIdBranchNew ? formValue : { buyerIdClientNew, textReason };
  }

  private buildSellerFormBody(): TransactionEditSellerForm {
    const component = this.sellerDealDutchAuctionComponent();
    const formValue = component.editForm.getRawValue();

    return {
      sellerIdClientNew: formValue.sellerIdClientNew,
      sellerIdBranchNew: formValue.sellerIdBranchNew,
      vatPercent: formValue.absoluteVatPercent,
      textReason: formValue.textReason,
    }
  }

  private getPrecision(): void {
    if (!this.currencyPrecision)
      this.currencyService
        .getPrecision(
          this.user?.token,
          this.goods[0].goodsSpecifications.find(
            (field) => field.idInterfaceField == 4
          )?.fieldValueNumber
        )
        .subscribe((res) => {
          this.currencyPrecision = res;
          this.prepareGoods();
        });
    else this.prepareGoods();
  }
}