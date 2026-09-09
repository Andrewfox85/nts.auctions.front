import { Injectable } from '@angular/core';
import { PERIOD_CONFIG } from '@constants';
import moment, { Moment } from 'moment';

export interface DeliveryPeriod {
  numberPeriod: number;
  startDate: moment.Moment;
  endDate: moment.Moment;
}

@Injectable({
  providedIn: 'root',
})
export class DeliveryPeriodService {
  /**
   * Метод построения периодов поставки
   */
  buildPeriods(
    deliveryView: 1 | 2 | 3,
    startDateStr: string,
    endDateStr: string,
  ): DeliveryPeriod[] {

    const cfg = PERIOD_CONFIG[deliveryView];
    if (!cfg) {
      throw new Error('Unknown deliveryView');
    }

    const startDate = moment(startDateStr, 'DD-MM-YYYY');
    const endDate = moment(endDateStr, 'DD-MM-YYYY');

    const periods: DeliveryPeriod[] = [];
    let cursor = startDate.clone();
    let index = 1;

    while (cursor.isSameOrBefore(endDate, 'day')) {
      const isFirst = index === 1;

      const periodStart = isFirst
        ? cursor.clone()
        : cursor.clone().startOf(cfg.startOf as moment.unitOfTime.StartOf);

      let periodEnd = cursor
        .clone()
        .endOf(cfg.endOf as moment.unitOfTime.StartOf);
      if (periodEnd.isAfter(endDate)) {
        periodEnd = endDate.clone();
      }

      periods.push({
        numberPeriod: cfg.number(periodStart),
        startDate: periodStart,
        endDate: periodEnd,
      });

      cursor = periodEnd.clone().add(1, 'day');
      index++;
    }

    return periods;
  }

  /**
   * Расчёт даты окончания поставки
   */
  calculateEndDate(
    startDateStr: string,
    deliveryTermType: number,
    deliveryPeriodValue: number | string,
  ): moment.Moment {

    const startDate = moment(startDateStr, 'DD-MM-YYYY');

    switch (deliveryTermType) {
      case 1: // дни
        return startDate.clone().add(Number(deliveryPeriodValue), 'days');

      case 2: // месяцы
        return startDate.clone().add(Number(deliveryPeriodValue), 'months');

      case 3: // дата
        return moment(deliveryPeriodValue, 'DD-MM-YYYY');

      default:
        throw new Error('Unknown deliveryTermType');
    }
  }

  /**
   * Формирование объекта периода поставки
   */
  createObject(
    date1: moment.Moment,
    date2: moment.Moment,
    period: number,
    goodItems: any[],
    objectArr: any[],
    isLastObject: boolean,
    periodsCount: number,
    idPeriod: string | number,
  ): any[] {
    let outResult = objectArr.length ? objectArr : [];
    let remainder = 0;
    let isSmallValueVsLargePeriod = false;

    // глубокое клонирование
    const cloneGoods = JSON.parse(JSON.stringify(goodItems));

    for (let i = 0; i < cloneGoods.length; i++) {
      const goodsCount = periodsCount;

      if (cloneGoods[i].volume > goodsCount) {
        remainder = parseFloat((cloneGoods[i].volume % goodsCount).toFixed(4));
        isSmallValueVsLargePeriod = false;
      } else {
        remainder = parseFloat((cloneGoods[i].volume / goodsCount).toFixed(4));
        isSmallValueVsLargePeriod = true;
      }

      if (remainder === 0) {
        cloneGoods[i].volume = Math.floor(cloneGoods[i].volume / goodsCount);
      } else {
        if (isSmallValueVsLargePeriod) {
          if (!isLastObject) {
            cloneGoods[i].volume = remainder;
          } else {
            cloneGoods[i].volume = +(
              cloneGoods[i].volume -
              remainder * (periodsCount - 1)
            ).toFixed(4);
          }
        } else {
          if (!isLastObject) {
            cloneGoods[i].volume = Math.floor(
              cloneGoods[i].volume / goodsCount,
            );
          } else {
            cloneGoods[i].volume =
              Math.floor(cloneGoods[i].volume / goodsCount) + remainder;
          }
        }
      }
    }

    const item = {
      numberPeriod: period,
      startDate: date1.format('DD.MM.YYYY'),
      endDate: date2.format('DD.MM.YYYY'),
      goods: cloneGoods,
      idPeriod,
    };

    outResult.push(item);

    return outResult;
  }

  public getDivideQuantityIntoPeriods(
    summaryVolume: number,
    count: number,
    isLastObject: boolean
  ): number {
    let remainder: number = 0;
    let isSmallValueVsLargePeriod: boolean = false;
    let periodVolume: number;

    if (summaryVolume > count) {
      remainder = parseFloat((summaryVolume % count).toFixed(4));
      isSmallValueVsLargePeriod = false;
    } else {
      remainder = parseFloat((summaryVolume / count).toFixed(4));
      isSmallValueVsLargePeriod = true;
    }

    if (remainder === 0) {
      periodVolume = Math.floor(summaryVolume / count);
    } else {
      if (isSmallValueVsLargePeriod) {
        if (!isLastObject) {
          periodVolume = remainder;
        } else {
          periodVolume = +Number((summaryVolume - remainder * (count - 1)).toFixed(4));
        }
      } else {
        if (!isLastObject) {
          periodVolume = Math.floor(summaryVolume / count);
        } else {
          periodVolume = Math.floor(summaryVolume / count) + remainder;
        }
      }
    }
    return periodVolume;
  }
}
