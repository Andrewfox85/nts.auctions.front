import {
  Component,
  input,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
  DestroyRef,
  signal
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DxValidationGroupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import {
  GoodAnalog,
  GoodAnalogLinks,
  GoodValue,
  DisplayRefs
} from '../../interfaces';
import { CounterService } from '@services';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { makeDemandRefs, makeCatalogRefs, makeNsiRefs } from '../../utils/display-string-refs.util';

@Component({
  selector: 'app-analog-good-form',
  imports: [
    TranslateModule,
    DxValidationGroupModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxValidatorModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './analog-good-form.component.html',
  styleUrl: './analog-good-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalogGoodFormComponent implements OnInit {
  public readonly good = input.required<GoodAnalog>();
  public readonly goodAnalogLinks = input.required<GoodAnalogLinks>();
  public readonly idDemand = input.required<number>();

  private readonly counterService = inject(CounterService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef); 

  public goodValues: GoodValue[];

  public valuesForDisplay = signal<DisplayRefs[]>([]); 

  constructor(private translate: TranslateService) {}

  public ngOnInit(): void {
    if (this.good()[0].goodValues?.length > 0) {
      this.goodValues = [...this.good()[0].goodValues];
      this.valuesForDisplay.set(makeDemandRefs(this.goodValues, this.translate.store.currentLang));
      
      this.counterService.catalogGood$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
        // обновляем форму данными каталожного товара
        if (event?.properties?.length) {
          this.valuesForDisplay.set(makeCatalogRefs(event, this.translate.store.currentLang));
        }
      });

      this.counterService.nsiGood$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
        // обновляем форму заполненными данными товара
        if (event?.properties?.length) {
          this.valuesForDisplay.set(makeNsiRefs(event));
        }
      });
    }
  }
}
