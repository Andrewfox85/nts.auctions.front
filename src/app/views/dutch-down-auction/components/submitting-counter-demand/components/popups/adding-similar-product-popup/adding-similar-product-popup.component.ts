import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
  input,
  output,
} from '@angular/core';
import { DX_MODULES } from '@constants';
import { TranslateModule } from '@ngx-translate/core';
import { DemandService, IAnalogGood } from '@services';
import { GlobalStore } from '@store';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, tap } from 'rxjs/operators';
import { IProperty, ISimilarProduct, ICloseEvent } from '../../../interfaces';
import { LoaderComponent } from '../../../../../../../shared/components/loader/loader.component';
import { SelectionChangedEvent } from 'devextreme/ui/data_grid';

@Component({
  selector: 'app-adding-similar-product-popup',
  imports: [...DX_MODULES, CommonModule, TranslateModule, LoaderComponent],
  templateUrl: './adding-similar-product-popup.component.html',
  styleUrl: './adding-similar-product-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddingSimilarProductPopupComponent {
  public readonly openSimilarProducts = input.required<boolean>();
  public readonly idModel = input.required<number>();
  public readonly idCatalogGood = input.required<number>();

  public addCatalogGood = output<IAnalogGood>();
  public close = output<ICloseEvent>();

  private readonly demandService = inject(DemandService);
  public readonly globalStore = inject(GlobalStore);
  private readonly idSection = this.globalStore.sessionInfo().sectionId;
  private readonly idSession = this.globalStore.sessionInfo().sessionId;
  private readonly idDemand = this.globalStore.idDemand();

  public selectedRow: ISimilarProduct;

  private readonly token = JSON.parse(localStorage.getItem('user') || '{}')?.token;

  public isLoading: boolean = false;

  public readonly catalogGoods = toSignal(
    this.demandService
      .getFilteredAnalogsCatalog(
        this.token,
        this.idSection?.toString(),
        this.idSession?.toString(),
        this.idDemand?.toString(),
        ''
      )
      .pipe(
        tap(() => (this.isLoading = true)),
        map((response) => response.goods),
        tap(() => (this.isLoading = false))
      )
  );

  public readonly catalogGoodsForShow = computed(() => {
    if (!this.catalogGoods()) {
      return [];
    }

    return this.catalogGoods().map((a) => ({
      ...a,
      ...Object.fromEntries(
        (a.properties ?? []).map((v) => [v.propertyName, v.propertyValue])
      ),
    }));
  });

  public readonly dynamicColumns = computed(() => {
    if (!this.catalogGoods()) {
      return [];
    }

    const allValues: IProperty[] = this.catalogGoods().flatMap(
      (a) => a.properties ?? []
    );

    const uniqueNames: IProperty[] = Array.from(
      new Map(allValues.map((v) => [v.propertyName, v])).values()
    );

    return uniqueNames.map((v) => ({
      caption: v.propertyName,
      dataField: v.propertyName,
    }));
  });

  public onSelectionChanged(e: SelectionChangedEvent): void {
    this.selectedRow = e.selectedRowsData[0];
  }

  public addGoodItem(): void {
    this.addCatalogGood.emit(this.selectedRow);
    this.closePopup();
  }

  public closePopup(type?: string): void {
    this.close.emit({ close: false, type: type || null });
  }
}
