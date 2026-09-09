import {
  Component,
  input,
  output,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  signal
} from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DxPopupModule,
  DxValidationGroupModule,
  DxSelectBoxModule,
  DxValidatorModule,
  DxNumberBoxModule,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { CounterService } from '@services';
import { User } from '@classes';
import { LocalStorageService } from '@shared-services';
import { GOOD_REF_ID } from '../../../constants';
import { GlobalStore } from '@store';
import {
  GoodValue,
  GoodAnalog,
  GoodAnalogLinks,
  ICloseEvent,
  OutputNsiRefsResult,
  ValueItem,
  IAddNsiEvent
} from '../../../interfaces';
import { AnalogFormService } from '../../../services/analog-form.service';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { role, AgreementType } from '@constants';
import {
  AddToGeneralCatalogResponse,
  FilterAnalogsNameGoodResponse,
  FiltersReferencesTreeResponse,
  GoodNames,
  ReferenceItem,
  FiltersReferencesTreeBody
} from './../../../../../../../services/counter-service/shared/interfaces/index';
import { NsiTreeDirective } from './../../../../../../../shared/directives/nsi-tree.directive';
import { getListPropertiesString, getListPropertiesAdd } from '@helpers';

@Component({
  selector: 'app-nsi-good-popup',
  imports: [
    TranslateModule,
    DxValidationGroupModule,
    DxPopupModule,
    DxSelectBoxModule,
    DxNumberBoxModule,
    DxValidatorModule,
    FormsModule,
    ReactiveFormsModule,
    NsiTreeDirective,
  ],
  templateUrl: './nsi-good-popup.component.html',
  styleUrl: './nsi-good-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NsiGoodPopupComponent {
  public readonly addNsiGood = input.required<boolean>();
  public readonly nomenclatureGroup = input.required<number>();
  public readonly goodGroup = input.required<number>();
  public readonly idModel = input.required<number>();
  public readonly idDemand = input.required<number>();
  public readonly goodAnalogLinks = input.required<GoodAnalogLinks>();
  public readonly good = input.required<GoodAnalog>();
  public readonly infoForm = input.required<any>();

  public addNsiGoodEvent = output<IAddNsiEvent>();
  public close = output<ICloseEvent>();

  private readonly counterService = inject(CounterService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly analogFormService = inject(AnalogFormService);

  private readonly globalStore = inject(GlobalStore);
  private readonly idSection = this.globalStore.idSection();

  public goodForm = signal<FormGroup | null>(null);
  public goodNames = signal<GoodNames[]>([]);
  public referencesTree = signal<ReferenceItem[]>([]);
  public goodValuesForDisplay = signal<GoodValue[]>([]); //создаем массив характеристик для заполнния на подобии goodValues из заявки, но на основании значений дерева из классифаера
  public goodValues: GoodValue[];
  public user: User = this.localStorageService.getUser() as User;

  public readonly GOOD_REF_ID = GOOD_REF_ID;

  //проверка на наличие каталожных товаров для отображения кнопки
  public get isCatalogGoods(): boolean {
    const hasAllowAnalogs: boolean = this.goodValues?.some(
      (ref) => ref.isAllowAnalogs
    );
    const hasNullListValues: boolean = this.goodValues?.some(
      (ref) => ref.listValues === null
    );
    return hasAllowAnalogs || hasNullListValues;
  }

  public isDisabled(item: GoodValue): boolean {
    const hasSingleValue: boolean = item.listValues?.length === 1;
    
    if (!hasSingleValue) {
      return false;
    }

    return (
      (!item.isAllowAnalogs && !item.valuesFromNsi) ||
      item.idReference === GOOD_REF_ID
    );
  }

  public get canAddGood(): boolean {
    return this.analogFormService.isTreeCompleted(
      this.goodValuesForDisplay(),
      this.referencesTree(),
      this.goodForm()
    );
  }

  public onPopupShown(): void {
    this.goodValues = [...this.good().goodValues];
    //сначала получаем дерево, затем преобразуем его в массив как в заявке на покупку и создаем форму для заполнения
    this.getNamesAndReferences();
  }

  public getNamesAndReferences(): void {
    this.counterService
      .getFilterAnalogsNameGood(this.user?.token, this.idDemand())
      .subscribe((res: FilterAnalogsNameGoodResponse) => {
        this.goodNames.set(res.goodNames);

        //для получения дерева хар-к отправляем только выбранное наименование (чтобы уменьшить кол-во возвращаемых элементов и упростить обработку дерева)
        const goodReference: GoodValue = this.goodValues.find(
          (item) => item.idReference === GOOD_REF_ID
        );
        const idNameValue: number = goodReference?.listValues?.[0]?.idValue;
        const idLink: number = this.goodNames().find(
          (el) => el.id === idNameValue
        )?.idLink;

        if (idLink && idNameValue) {
          this.loadReferencesTree(idLink, idNameValue);
        }
      });
  }

  public onChangeName(event: ValueChangedEvent, item: GoodValue): void {
    //если изменяем наименование - перезапрашиваем хар-ки товара для заполнения нового товара
    if (item.idReference === GOOD_REF_ID) {
      const idLink: number = this.goodNames().find(
        (el) => el.id === event.value
      )?.idLink;

      this.loadReferencesTree(idLink, event.value);

      return;
    }

    //если выбрали НЕ наименование добавляем детей хар-ки в зависимости от выбранного значения
    this.goodValuesForDisplay.set(
      this.analogFormService.addChildrenFromValue(
        this.goodValuesForDisplay(),
        this.referencesTree(),
        item,
        event.value,
        event.previousValue
      )
    );

    //обновляем форму новым деревом
    this.analogFormService.updateGoodFormControls(
      this.goodForm(),
      this.goodValuesForDisplay()
    );
  }

  private loadReferencesTree(idLink: number, idNameValue: number): void {
    const body: FiltersReferencesTreeBody = {
      idSection: this.idSection,
      listLinks: [idLink],
      listPropertiesStr: getListPropertiesString(this.goodValues),
      listReferencesAdd: getListPropertiesAdd(this.goodValues)
    }

    this.counterService
      .getFiltersReferencesTree(this.user?.token, body)
      .subscribe((res: FiltersReferencesTreeResponse) => {
        this.referencesTree.set(res.references);

        this.goodValuesForDisplay.set(
          this.analogFormService.buildGoodValues(
            this.goodValues,
            this.referencesTree(),
            this.goodNames() //передаем наименования отдельно, чтобы отдельно записать ВСЕ наименования в goodValuesForDisplay
          )
        );

        this.goodForm.set(
          this.analogFormService.createGoodForm(this.goodValuesForDisplay(), {
            [GOOD_REF_ID]: idNameValue,
          })
        );
      });
  }

  public addNsiGoodToForm(): void {
    const properties: OutputNsiRefsResult[] = Object.entries(
      this.goodForm().value
    )
      .filter(([_, value]) => value !== null && value !== undefined)
      .map(([key, value]) => {
        const idReference: number = Number(key);
        const idValue: number = Number(value);

        const reference: GoodValue = this.goodValuesForDisplay().find(
          (ref) => ref.idReference === idReference
        );
        const valueObj: ValueItem = reference?.listValues.find(
          (val) => val.idValue === idValue
        );

        return {
          idReference: idReference,
          referenceName: reference?.referenceName,
          idValue: idValue,
          valueName: valueObj.valueName,
        };
      });

    let IdFirmClient: number | null = null;

    if (this.infoForm().participant === role.broker) {
      if (this.infoForm().contractType === AgreementType.Commission) {
        IdFirmClient = null;
      }

      if (this.infoForm().contractType === AgreementType.Agency) {
        if (this.infoForm().brokerClient)
          IdFirmClient = this.infoForm().brokerClient;
      }
    }

    const idGoodName: number = properties.find(
      (item) => item.idReference === GOOD_REF_ID
    )?.idValue;

    const listProperty: number[] = properties
      .filter((item) => item.idReference !== GOOD_REF_ID)
      .map((item) => item.idValue);

    const isListClients: boolean =
      this.infoForm().participantlue !== role.visitor;

    const listClientsValue: number[] | null = IdFirmClient
      ? [IdFirmClient]
      : null;
    const listClients: Record<string, number[]> = isListClients
      ? { listClients: listClientsValue }
      : {}; 

    const body = {
      idSection: this.idSection,
      idNomenclatureGroup: this.nomenclatureGroup(),
      idGoodGroup: this.goodGroup(),
      idGoodName: idGoodName,
      listProperty: listProperty,
      idModel: this.idModel(),
      ...listClients,
    };

    this.counterService
      .addToGeneralCatalog(this.user?.token, body)
      .subscribe((resGood: AddToGeneralCatalogResponse) => {
        if (resGood.idGood) {
          this.addNsiGoodEvent.emit({
            idCatalogGood: resGood.idGood,
            properties: properties,
          });
          this.closePopup();
        }
      });
  }

  public closePopup(type?: string): void {
    this.close.emit({ close: false, type: type || null });
  }
}
