import {
  Component,
  input,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GoodValue, DisplayRefs, GoodAnalog, AnalogBid } from './../interfaces';
import { GlobalStore } from '@store';
import { TranslateService } from '@ngx-translate/core';
import { makeChoosenRefs } from './../utils/display-string-refs.util';
import { makeDemandRefs } from './../../../views/dutch-down-auction/components/submitting-counter-demand/utils/display-string-refs.util';
@Component({
  selector: 'app-analog-form',
  imports: [TranslateModule],
  templateUrl: './analog-form.component.html',
  styleUrl: './analog-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class AnalogFormComponent implements OnInit {
  public readonly good = input.required<GoodAnalog>();
  public readonly analogsBidsList = input.required<AnalogBid[]>();
  public readonly idGood = input.required<number>();

  private readonly translate = inject(TranslateService);
  public readonly globalStore = inject(GlobalStore);

  public readonly analog = this.globalStore.selectedAnalog;

  public goodValues: GoodValue[];
  public valuesForDisplay = signal<DisplayRefs[]>([]);

  constructor() {
    effect(() => {
      if (this.analog()?.values?.length) {
        this.valuesForDisplay.set(makeChoosenRefs(this.analog()?.values));
      }
    });
  }

  public ngOnInit(): void {
    if (!this.idGood()) {
      //если ставки еще не было - значения из заявки
      this.goodValues = [...this.good()[0].goodValues];
      this.valuesForDisplay.set(
        makeDemandRefs(this.goodValues, this.translate.store.currentLang)
      );
    } else {
      //предзаполняем хар-ки товара из прошлой ставки - значения берем из таблицы товаров (ищем по idGood)
      const choosenGood: AnalogBid[] = this.analogsBidsList().filter(
        (an) => an.idGood === this.idGood()
      );

      this.valuesForDisplay.set(makeChoosenRefs(choosenGood[0]?.values));
    }
  }
}
