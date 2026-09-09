import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES } from '@constants';
import { ExcelDatePipe, ToNumberPipe, RuNumberFormatPipe } from '@pipes';
import { EditDemandOfferServiceService } from "../../services/edit-demand-offer-service.service";
import { checkSameUnits } from '@helpers';

@Component({
    selector: 'app-delivery-schedule-info',
    standalone: true,
    imports: [CommonModule, TranslateModule, ...DX_MODULES, ExcelDatePipe, ToNumberPipe, RuNumberFormatPipe],
    templateUrl: './delivery-schedule-info.component.html',
    styleUrls: ['./delivery-schedule-info.component.scss']
})
export class DeliveryScheduleInfoComponent {
  @Input() deliverySch;
  @Input() deliverySchParent;
  @Input() goods;
  @Input() type;
  @Input() concatedStringDeliveryTerm;      //итоговая строка срока поставки
  @Input() isDeliveryScheduleGraded: boolean = false;

  schedule = [];          //для сравнения графика первоначальный массив

  private readonly editDemandOfferServiceService = inject(EditDemandOfferServiceService);
  totalRowData: any={};

  ngOnChanges(){

    this.schedule = JSON.parse(JSON.stringify(this.deliverySch))

    if (this.deliverySch?.length > 0 && !this.deliverySch[0][1]) {
      if (this.isDeliveryScheduleGraded) {
        this.deliverySch = this.deliverySch.flatMap(sch =>
          this.goods.map(good => ({
            ...sch,
            idDemandOfferGood: good.idGood,
            ...this.editDemandOfferServiceService.getGenerateGoodFields(good)
          }))
        );
      } else {
        this.deliverySch.forEach(sch => {
          this.goods.forEach(good => {
            if (good.goodsSpecifications[0].idDemandOfferGood === sch.idDemandOfferGood) {
              Object.assign(sch, this.editDemandOfferServiceService.getGenerateGoodFields(good));
            }
          });
        });
      }

      this.deliverySch.sort((a, b) => a.idDemandOfferGood - b.idDemandOfferGood);

      this.deliverySch = this.deliverySch.reduce(function (r, a) {       //сгруппированы поля по periodDateBegin
        r[a.periodDateBegin] = r[a.periodDateBegin] || [];
        r[a.periodDateBegin].push(a);
        return r;
      }, {});
      this.deliverySch = Object.entries(this.deliverySch)

      if(this.type == 'counterRegister'){
        let volumeSum = 0, precision;
        this.goods.forEach(good => {
          let volume = good.goodsSpecifications.find(field => field.idInterfaceField == 1)
          volumeSum = volumeSum + volume.fieldValueNumber;
          precision = volume.fieldPrecision
        })
        this.totalRowData.quantityOffer =  Number(volumeSum).toLocaleString('ru', {maximumFractionDigits: precision}) + ' ' + this.goods[0].unitName;
      }
    }
  }

  get onSameUnits(): boolean {
    return checkSameUnits(this.goods);
  }

  getFieldValue(goodsSpecifications) {
    return goodsSpecifications.find(el => el.idInterfaceField == 1)
  }

  changeSchedule(){
    //приходит всегда в одинаковом порядке, сравниваем объекты без учета товара, только по датам и количеству.
    let schedule = this.schedule.map((el) => ({periodDateBegin: el.periodDateBegin, periodDateEnd: el.periodDateEnd, periodVolume: el.periodVolume}));
    let delivSchPeriodsParent = this.deliverySchParent.map((el) => ({periodDateBegin: el.periodDateBegin, periodDateEnd: el.periodDateEnd, periodVolume: el.periodVolume}))
    //сравнение двух массивов в зависимости от расположения элементов
    return schedule?.length === delivSchPeriodsParent?.length && schedule.every((value, index) => JSON.stringify(value) === JSON.stringify(delivSchPeriodsParent[index]))
  }
}
