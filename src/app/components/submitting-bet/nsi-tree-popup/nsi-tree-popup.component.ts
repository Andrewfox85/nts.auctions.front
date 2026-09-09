import {
  Component,
  input,
  ChangeDetectionStrategy,
  output,
  signal,
  inject,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { DxPopupModule, DxTooltipModule, DxSelectBoxModule } from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { GoodAnalog, AnalogList, GoodAnalogLinks, GoodValue, AnalogListItem } from '../interfaces';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { GlobalStore } from '@store';
import { GOOD_REF_ID } from '../constants';
import { CounterService } from '@services';
import { User } from '@classes';
import { LocalStorageService } from '@shared-services';
import {
  ReferenceItem,
  FiltersReferencesTreeResponse,
  FiltersReferencesTreeBody
} from './../../../services/counter-service/shared/interfaces/index';
import { NsiTreeService } from '../services/nsi-tree.service';
import { NsiTreeDirective } from './../../../shared/directives/nsi-tree.directive';
import { getListPropertiesString, getListPropertiesAdd } from '@helpers';


@Component({
  selector: 'app-nsi-tree-popup',
  imports: [
    TranslateModule,
    DxPopupModule,
    FormsModule,
    ReactiveFormsModule,
    DxTooltipModule,
    DxSelectBoxModule,
    NsiTreeDirective,
  ],
  templateUrl: './nsi-tree-popup.component.html',
  styleUrl: './nsi-tree-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NsiTreePopupComponent {
  public readonly nsiTreePopup = input.required<boolean>();
  public readonly analogsList = input.required<AnalogList>();
  public readonly goodAnalogLinks = input.required<GoodAnalogLinks>();
  public readonly good = input.required<GoodAnalog>();
  public readonly idGood = input.required<number>();
  public addNsiGood = output<AnalogListItem>();
  public close = output<void>();

  public readonly globalStore = inject(GlobalStore);
  private readonly counterService = inject(CounterService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly nsiTreeService = inject(NsiTreeService);
  private readonly idSection = this.globalStore.idSection();
  public user: User = this.localStorageService.getUser() as User;

  public goodForm = signal<FormGroup | null>(null);
  public goodValues: GoodValue[];
  public referencesTree = signal<ReferenceItem[]>([]);
  public goodValuesForDisplay = signal<GoodValue[]>([]);

  public readonly GOOD_REF_ID = GOOD_REF_ID;

  public onPopupShown(): void {
    this.goodValues = [...this.good()[0].goodValues];
    //сначала получаем дерево, затем преобразуем его в массив как в заявке на покупку и создаем форму для заполнения
    this.getReferenceTree();
  }

  public getReferenceTree(): void {
    const body: FiltersReferencesTreeBody = {
      idSection: this.idSection,
      listLinks: [this.goodAnalogLinks()?.idLinkGoodName],
      listPropertiesStr: getListPropertiesString(this.goodValues),
      listReferencesAdd: getListPropertiesAdd(this.goodValues),
    }

    this.counterService
      .getFiltersReferencesTree(this.user?.token, body)
      .subscribe((res: FiltersReferencesTreeResponse) => {
        this.referencesTree.set(res.references);

        this.goodValuesForDisplay.set(
          this.nsiTreeService.buildGoodValuesForBid(
            this.goodValues,
            this.referencesTree()
          )
        );

        //создаем базовую форму
        const form = this.nsiTreeService.createGoodForm(
          this.goodValuesForDisplay()
        );

        //если есть выбранный товар, заполняем его значениями форму
        if (this.idGood()) {
          const currentGood: AnalogListItem = this.analogsList().find(
            (an) => an.idGood === this.idGood()
          );

          if (currentGood && currentGood.listValuesForm) {
            form.patchValue(currentGood.listValuesForm);
          }
        }

        this.goodForm.set(form);
      });
  }

  public onChangeValue(event: ValueChangedEvent, item: GoodValue): void {
    //добавляем детей хар-ки в зависимости от выбранного значения
    this.goodValuesForDisplay.set(
      this.nsiTreeService.addChildrenFromValue(
        this.goodValuesForDisplay(),
        this.referencesTree(),
        item,
        event.value,
        event.previousValue
      )
    );

    //обновляем форму новым деревом
    this.nsiTreeService.updateGoodFormControls(
      this.goodForm(),
      this.goodValuesForDisplay()
    );
  }

  //находим сформированный товар в гриде analogsList и передаем на форму подачи ставки/заявки
  public addGood(): void {
    const choosenGood: AnalogListItem = this.analogsList().find(
      (item) =>
        JSON.stringify(item.listValuesForm) ===
        JSON.stringify(this.goodForm().value)
    );
    this.addNsiGood.emit(choosenGood);
    this.closePopup();
  }

  public closePopup(): void {
    this.close.emit();
  }
}
