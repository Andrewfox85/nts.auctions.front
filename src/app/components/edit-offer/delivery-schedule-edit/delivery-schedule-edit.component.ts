import { Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { editingRules, DX_MODULES, DeliveryView } from '@constants';
import { CommonService, TradingService } from '@services';
import * as Moment from 'moment';
import { extendMoment } from 'moment-range';
import { Subject, Subscription } from 'rxjs';
import { RuNumberFormatPipe } from '@pipes';
import { DeliveryPeriodService } from '../../../shared/services/delivery-schedule-service/delivery-schedule.service';
import { DisableNumberBoxWheel } from "../../../shared/directives/disable-number-box-wheel";
import { SumVolumePipe } from "../../../shared/pipes/sumVolume/sum-volume-pipe";
import { ValueChangedEvent } from "devextreme/ui/number_box";
import { takeUntil } from "rxjs/operators";
import { EditDemandOfferServiceService, ScheduleData } from "../../../services/edit-demand-offer-service.service";
import { checkSameUnits } from '@helpers';


const momentRange = extendMoment(Moment);

@Component({
  selector: 'app-delivery-schedule-edit',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
    RuNumberFormatPipe,
    DisableNumberBoxWheel,
    SumVolumePipe
  ],
  templateUrl: './delivery-schedule-edit.component.html',
  styleUrls: ['./delivery-schedule-edit.component.scss'],
})
export class DeliveryScheduleEditComponent implements OnInit, OnDestroy {
  @Input() goods = [];
  @Input() deliveryScheduleList; //пересечения возможных вариантов в выпадающем списке
  @Input() delivSchPeriods; //график из заявки (текущий по заявке)
  @Input() idDeliveryScheduleType; //выбранный тип график в заявке
  @Input() typeDeliverySchedule; //тип (календарные дни/месяц/дата)
  @Input() concatedStringDeliveryTerm; //итоговая строка срока поставки
  @Input() deliveryStartDate;
  @Input() deliveryPeriodInDays;
  @Input() idSessionPeriod;
  @Input() editRulesIntersections;
  @Input() isSameGradedSaleOffer: boolean = false;
  @Input() scheduleData: ScheduleData[]; //сформированный массив в нужной форме для отображения
  @Output() onRedFlag = new EventEmitter<any>();
  @Output() onHideRedFlag = new EventEmitter<any>();
  //scheduleData = [];
  sumVolumeGoodSchedule = [];
  changeDeliveryParams: Subscription;
  changeVolume: Subscription;

  typePeriod = this.formBuilder.group({
    term: ['', Validators.required],
  });

  sumVolumeGoodTerm = [];
  goodsArray = [];
  totalRowData: any = {};
  isScheduleView = true;
  private sumVolumePipe: SumVolumePipe = inject(SumVolumePipe);
  private destroy$: Subject<void> = new Subject<void>();
  private updateTotalTableSubject: Subject<ScheduleData[]> = new Subject<ScheduleData[]>();
  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);

  constructor(
    private formBuilder: FormBuilder,
    public translate: TranslateService,
    private tradingService: TradingService,
    private commonService: CommonService,
    private deliveryPeriodService: DeliveryPeriodService,
  ) {}

  ngOnInit(): void {
    // const datepipe: DatePipe = new DatePipe('en-US')            //задает формат даты
    this.goods.forEach((good) => {
      this.goodsArray.push({
        idGood: good.idGood,
        name: good.goodName,
        volume: this.getFieldValue(good.goodsSpecifications).fieldValueNumber,
        units: good.unitName,
        properties: good.properties,
      });
    });

    if (this.isSameGradedSaleOffer) {
      this.delivSchPeriods = this.delivSchPeriods.flatMap(sch =>
        this.goods.map(good => ({
          ...sch,
          idGood: good.idGood,
         ...this.editDemandOfferServiceService.getGenerateGoodFields(good, true)
        }))
      );
    } else {
      this.delivSchPeriods.forEach((sch) => {
        // добавление полей необходимых для товаров
        this.goods.forEach((good) => {
          if (
            good.goodsSpecifications[0].idDemandOfferGood == sch.idDemandOfferGood
          ) {
            Object.assign(sch, {
              idGood: good.idGood,
              ...this.editDemandOfferServiceService.getGenerateGoodFields(good, true)
            });
          }
        });
      });
    }
    //формирования массива с суммой объема по товарам из графика поставки
    let sumGoodsVolume = this.delivSchPeriods.reduce(function (r, a) {
      //сгруппированы поля по idOffer
      r[a.idGood] = r[a.idGood] || [];
      r[a.idGood].push(a);
      return r;
    }, {});
    sumGoodsVolume = Object.entries(sumGoodsVolume);
    sumGoodsVolume.forEach((good) => {
      let sum = 0;
      good[1].forEach((item) => {
        sum = sum + item.periodVolume;
      });
      this.sumVolumeGoodTerm.push({
        idGood: good[0],
        sumValue: sum,
      });
    });
    if (this.delivSchPeriods?.length == 0) {
      this.goods.forEach((good) => {
        this.sumVolumeGoodTerm.push({
          idGood: good.idGood,
          sumValue: 0,
        });
      });
    }

    if (!this.idDeliveryScheduleType && this.idDeliveryScheduleType != 0) {
      this.scheduleData = [];
      this.isScheduleView = false;
    } else
      this.typePeriod.controls.term.patchValue(
        this.idDeliveryScheduleType.toString(),
      );

    //   if (this.onSameUnits()) {                                                   //Количество
    let volumeSum = 0,
      volumeSumSchedule = 0,
      precision;
    this.goods.forEach((good) => {
      let volume = good.goodsSpecifications.find(
        (field) => field.idInterfaceField == 1,
      );
      volumeSum = volumeSum + volume.fieldValueNumber;
      precision = volume.fieldPrecision;
    });
    this.totalRowData.quantityOffer =
      Number(volumeSum).toLocaleString('ru', {
        maximumFractionDigits: precision,
      }) +
      ' ' +
      this.goods[0].unitName;
    this.sumVolumeGoodTerm.forEach((good) => {
      volumeSumSchedule = volumeSumSchedule + Number(good.sumValue.toFixed(4));
    });
    this.totalRowData.quantitySchedule =
      Number(volumeSumSchedule).toLocaleString('ru', {
        maximumFractionDigits: precision,
      }) +
      ' ' +
      this.goods[0].unitName;

    this.changeDeliveryParams =
      this.tradingService.changeDeliveryParams$.subscribe((res: any) => {
        if (res.deliveryType) this.typeDeliverySchedule = res.deliveryType;
        if (res.deliveryPeriodInDays)
          this.deliveryPeriodInDays = res.deliveryPeriodInDays;
        if (res.deliveryStartDate)
          this.deliveryStartDate = res.deliveryStartDate;
        if (res.concatedStringDeliveryTerm) {
          this.concatedStringDeliveryTerm = res.concatedStringDeliveryTerm;
          this.getReturnSchedule();
        }
        this.onRedFlag.emit();

        if (res.schedule) {
          this.scheduleData = [];
          this.isScheduleView = false;
          this.onHideRedFlag.emit();
        }
        if (res.returnSchedule) {
          this.isScheduleView = true;
          this.typePeriod.controls.term.patchValue('0');
          this.getReturnSchedule();
        }
      });

    this.changeVolume = this.tradingService.changeVolume$.subscribe(
      (res: any) => {
        this.goods = res.goods;
        let volumeSum = 0,
          precision;
        this.goodsArray = this.goodsArray.map((good) => {
          const findGood = this.goods.find((el) => el.idGood === good.idGood);
          return {
            ...good,
            volume: this.getFieldValue(findGood.goodsSpecifications)?.fieldValueNumber || 0
          };
        });
        this.goods.forEach((good) => {
          let volume = good.goodsSpecifications.find(
            (field) => field.idInterfaceField == 1,
          );
          volumeSum = volumeSum + volume.fieldValueNumber;
          precision = volume.fieldPrecision;
        });
        this.totalRowData.quantityOffer =
          Number(volumeSum).toLocaleString('ru', {
            maximumFractionDigits: precision,
          }) +
          ' ' +
          this.goods[0].unitName;
        if (this.scheduleData?.length > 0) {
          const isEqual: boolean =
            !this.isSameGradedSaleOffer ?
              this.isEqualTotalVolume() :
              this.isEqualTotalVolumeGrade();
          if (isEqual) {
            this.onHideRedFlag.emit();
          } else this.onRedFlag.emit();
        }
      },
    );

    this.updateTotalTableSubject
      .pipe(takeUntil(this.destroy$))
      .subscribe((array) => {
        this.scheduleData = [...array];
      });
  }

  getReturnSchedule() {
    this.scheduleData = [];
    this.sumVolumeGoodTerm.forEach((sch) => {
      sch.sumValue = 0;
    });
    this.totalRowData.quantitySchedule = 0;
    /* if (this.totalRowData.find(el => el.quantitySchedule)) {
      this.totalRowData.find(el => el.quantitySchedule).quantitySchedule =  0
    }*/
  }

  getFieldValue(goodsSpecifications) {
    return goodsSpecifications.find((el) => el.idInterfaceField == 1);
  }

  editRuleInIntersections() {
    return (
      this.editRulesIntersections?.find((el) => el.idInterfaceField == 39)
        ?.idEditRule || null
    );
  }

  onChangeVolume(e, index, id) {
    let sumValue = this.sumVolumeGoodTerm.find(
      (el) => el.idGood == e.element.id.split('_')[1],
    ).sumValue;
    this.sumVolumeGoodTerm.find(
      (el) => el.idGood == e.element.id.split('_')[1],
    ).sumValue = sumValue - e.previousValue + e.value;
    this.scheduleData[index].goods.find((g) => g.idGood == id).volume = e.value;

    //if (this.onSameUnits()) {                                                   //Количество
    let volumeSum = 0,
      precision;
    this.sumVolumeGoodTerm.forEach((good) => {
      volumeSum = volumeSum + good.sumValue;
      precision = 4;
    });
    this.totalRowData.quantitySchedule =
      Number(volumeSum).toLocaleString('ru', {
        maximumFractionDigits: precision,
      }) +
      ' ' +
      this.goods[0].unitName;
    this.isNeedFlag();
  }

  public isNeedFlag(): void {
    const isEqual: boolean =
      !this.isSameGradedSaleOffer ?
        this.isEqualTotalVolume() :
        this.isEqualTotalVolumeGrade();
    if (isEqual) {
      this.onHideRedFlag.emit();
      this.onEditSchedule();
    } else this.onRedFlag.emit();
  }

  public onCreateSchedule(): void {
    if (this.typePeriod.valid) {
      const termValue: number = Number(this.typePeriod.controls.term?.value);
      const deliveryViewMap: Record<number, DeliveryView> = {
        2: DeliveryView.Week,
        3: DeliveryView.Month,
        4: DeliveryView.Quarter,
      };
      const deliveryView: DeliveryView = deliveryViewMap[termValue];
      const deliverySchedule: number = Number(this.typeDeliverySchedule);
      this.scheduleData = this.getDeliveryScheduleData(
        this.goodsArray,
        deliveryView,
        deliverySchedule,
        momentRange.unix(this.deliveryStartDate / 1000).format('DD-MM-YYYY'),
        this.typeDeliverySchedule == 3
          ? momentRange
              .unix(this.deliveryPeriodInDays / 1000)
              .format('DD-MM-YYYY')
          : this.deliveryPeriodInDays,
      );

      this.goods.forEach((item) => {
        this.sumVolumeGoodTerm.find((el) => el.idGood == item.idGood).sumValue =
          this.getFieldValue(item.goodsSpecifications).fieldValueNumber;
      });

      //if (this.onSameUnits()) {                                                   //Количество
      let volumeSum = 0,
        precision;
      this.sumVolumeGoodTerm.forEach((good) => {
        volumeSum = volumeSum + good.sumValue;
        precision = 4;
      });
      this.totalRowData.quantitySchedule =
        Number(volumeSum).toLocaleString('ru', {
          maximumFractionDigits: precision,
        }) +
        ' ' +
        this.goods[0].unitName;

     this.isNeedFlag();
    }
  }

  getDeliveryScheduleData(
    goodItems: any[],
    deliveryView: 1 | 2 | 3,
    deliveryTermType: number,
    deliveryStartDate: string,
    deliveryPeriodValue: number | string,
  ) {
    const endDate = this.deliveryPeriodService.calculateEndDate(
      deliveryStartDate,
      deliveryTermType,
      deliveryPeriodValue,
    );

    const periods = this.deliveryPeriodService.buildPeriods(
      deliveryView,
      deliveryStartDate,
      endDate.format('DD-MM-YYYY'),
    );

    let result: any[] = [];

    const idPeriod = this.typePeriod.get('term')?.value;

    if (!this.isSameGradedSaleOffer) {
      periods.forEach((p, index) => {
        result = this.deliveryPeriodService.createObject(
          p.startDate,
          p.endDate,
          p.numberPeriod,
          goodItems,
          result,
          index === periods.length - 1,
          periods.length,
          idPeriod,
        );
      });
    } else {
      periods.forEach((p, index) => {
        result.push({
            numberPeriod: p.numberPeriod,
            startDate: p.startDate.format('DD.MM.YYYY'),
            endDate: p.endDate.format('DD.MM.YYYY'),
            goods: goodItems,
            idPeriod,
            periodVolume: this.deliveryPeriodService.getDivideQuantityIntoPeriods(
              this.sumVolumePipe.transform(this.goodsArray, 'volume'),
              periods.length,
              index === periods.length - 1
            )
          }
        );
      });
    }

    return result;
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  isEqualTotalVolume() {
    return (
      this.totalRowData?.quantityOffer == this.totalRowData?.quantitySchedule
    );
  }

  public isEqualTotalVolumeGrade(): boolean {
    return this.sumVolumePipe.transform(this.scheduleData, 'periodVolume') ===
      this.sumVolumePipe.transform(this.goodsArray, 'volume');
  }

  onEditSchedule() {
    this.tradingService.nonDisabledSaveButton({
      schedule: {
        scheduleData: this.scheduleData,
        idDeliveryScheduleType: this.typePeriod.controls.term.value,
      },
    });
  }

  public onTotalVolumeChanged(event: ValueChangedEvent, periodIndex: number): void {
    this.scheduleData[periodIndex].periodVolume = Number(event.value) || 0;
    this.updateTotalTableSubject.next(this.scheduleData);
    this.isNeedFlag();
  }

  ngOnDestroy() {
    this.changeDeliveryParams.unsubscribe();
    this.changeVolume.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    this.updateTotalTableSubject.complete();
  }

  /*  onSave(){
      if(this.typePeriod.controls.term?.value){
        let error= false;
        this.goodsList.forEach(good=>{
          if(good.volume != this.sumVolumeGoodTerm.find(el => el.id == good.id).sumValue){
            error = true;
          }
        })
        if(!error) {
          this.save.emit(Object.assign({}, {'schedule': this.scheduleData, 'term': this.typePeriod.controls.term?.value, 'sumVolumeGoodTerm': this.sumVolumeGoodTerm}))
        } else{
          this.isVisible = true
        }
      }
    }*/

  protected readonly editingRules = editingRules;
  protected readonly Number = Number;
}
