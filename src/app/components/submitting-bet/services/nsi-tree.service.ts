import { Injectable, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validators,
  FormGroup,
} from '@angular/forms';
import { GOOD_REF_ID, LEVEL_OF_GOOD_CHILD } from '../constants';
import { GoodValue, ValueItem } from '../interfaces';
import { ReferenceItem } from './../../../services/counter-service/shared/interfaces/index';

@Injectable({
  providedIn: 'root',
})
export class NsiTreeService {
  private readonly formBuilder = inject(FormBuilder);

  public createGoodForm(goodValues: GoodValue[]): FormGroup {
    goodValues.sort((a, b) =>
      a.idReference === GOOD_REF_ID ? -1 : b.idReference === GOOD_REF_ID ? 1 : 0
    );
    const formControls: { [key: string]: FormControl } = {};
    goodValues.forEach((item) => {
      let defaultValue: number | null = item.listValues?.[0]?.idValue ?? null;

      formControls[item.idReference.toString()] = new FormControl(
        defaultValue,
        Validators.required
      );
    });

    return this.formBuilder.group(formControls);
  }

  public updateGoodFormControls(
    form: FormGroup,
    goodValues: GoodValue[]
  ): void {
    const currentControlNames: Set<string> = new Set(
      goodValues.map((item) => item.idReference.toString())
    );

    goodValues.forEach((item) => {
      const controlName: string = item.idReference.toString();

      if (!form.contains(controlName)) {
        form.addControl(controlName, new FormControl(null));
      }
    });

    //удаляем характеристики которых больше нет
    Object.keys(form.controls).forEach((controlName) => {
      if (!currentControlNames.has(controlName)) {
        form.removeControl(controlName);
      }
    });
  }

  //из дерева хар-ка полученных из БД выстраиваем такую же структуру как в заявке на покупку их спраочника наименование  + его дети (более глубокие ветки будем добавлять по мере заполнения формы для корректной фильтрации справочников и их значений)
  //хар-ки с множесвенным выбором - значения берем из заявки на покупку,хар-ки с галочкой Аналоги и пустым listValues из НСИ (то есть из referencesTree)
  public buildGoodValuesForBid(
    goodValues: GoodValue[],
    referencesTree: ReferenceItem[]
  ): GoodValue[] {
    //берем только наименование и его детей
    const firstLevelRefs: ReferenceItem[] = referencesTree.filter(
      (ref) =>
        ref.lvl === LEVEL_OF_GOOD_CHILD || ref.idReference === GOOD_REF_ID
    );

    const treeValues: Record<number, GoodValue> = this.groupTreeItems(
      firstLevelRefs,
      (item) => {
        const parent = referencesTree.find(
          (ref) => ref.idLink === item.idLinkParent
        );
        return parent?.idReference ?? GOOD_REF_ID;
      }
    );

    let result: GoodValue[] = [];

    goodValues.forEach((item) => {
      const treeItem: GoodValue = treeValues[item.idReference];

      if (!treeItem) {
        return;
      }

      //строим характеристику - оставляем те значения из заявки, которые есть в дереве - берём первый выбранный элемент - ищем его детей и добавляем сразу в отображаение
      const updatedItem: GoodValue = this.updateExistingValuesWithLinks(
        item,
        treeItem.listValues
      );

      result.push({
        ...updatedItem,
        parentIdReference: treeItem.parentIdReference,
        level: treeItem.level,
        isDisabled: treeItem.listValues?.length === 1, //дизэйблим хар-ку, если она заполнена ЕДИНСТВЕННЫМ значением из заявки
      });
    });

    //раскрываем детей
    return this.expandChildrenForSelectedValues(result, referencesTree);
  }

  public addChildrenFromValue(
    goodValues: GoodValue[],
    referencesTree: ReferenceItem[],
    parentItem: GoodValue,
    choosenValue: number,
    previousValue?: number
  ): GoodValue[] {
    let result: GoodValue[] = [...goodValues];

    //удаляем старую ветку
    if (previousValue !== null) {
      const previousLink: number = parentItem.listValues.find(
        (value) => value.idValue === previousValue
      )?.idLink;

      if (previousLink) {
        result = this.removeBranchByParentLink(result, previousLink);
      }
    }

    //строим новую
    const currentLink: number = parentItem.listValues.find(
      (value) => value.idValue === choosenValue
    )?.idLink;

    if (!currentLink) {
      return result;
    }

    const children: ReferenceItem[] = referencesTree.filter(
      (ref) => ref.idLinkParent === currentLink
    );

    if (!children.length) {
      return result;
    }

    const grouped: Record<number, GoodValue> = this.groupTreeItems(
      children,
      (item) => {
        const parent: ReferenceItem = referencesTree.find(
          (ref) => ref.idLink === item.idLinkParent
        );

        return parent?.idReference;
      }
    );

    const newChildren: GoodValue[] = Object.values(grouped).map((item) => {
      const updatedItem: GoodValue = this.updateExistingValuesWithLinks(item, item.listValues);
      
      return {
        ...updatedItem,
        isDisabled: item.listValues?.length === 1, //дизэйблим хар-ку, если она заполнена ЕДИНСТВЕННЫМ значением из заявки
      };
    });

    //вставляем ребенка ПОСЛЕ родителя
    const parentIndex: number = result.findIndex(
      (item) => item.idReference === parentItem.idReference
    );

    if (parentIndex === -1) {
      return result;
    }

    result.splice(parentIndex + 1, 0, ...newChildren);

    return result;
  }

  //удаление всей предыдущей заполненной ветки
  private removeBranchByParentLink(
    goodValues: GoodValue[],
    parentLink: number
  ): GoodValue[] {
    const children: GoodValue[] = goodValues.filter(
      (item) => item.idLinkParent === parentLink
    );

    let result: GoodValue[] = [...goodValues];

    for (const child of children) {
      result = this.removeBranchByParentLink(result, child.idLink);
    }

    result = result.filter((item) => item.idLinkParent !== parentLink);

    return result;
  }

  //группировка элементов дерева
  private groupTreeItems(
    items: ReferenceItem[],
    getParentId: (item: ReferenceItem) => number | null
  ): Record<number, GoodValue> {
    return items.reduce((acc, item) => {
      if (!acc[item.idReference]) {
        acc[item.idReference] = {
          idReference: item.idReference,
          referenceName: item.referenceName,
          listValues: [],
          isAllowAnalogs: false,
          parentIdReference: getParentId(item),
          idLink: item.idLink,
          idLinkParent: item.idLinkParent,
          level: item.lvl,
        };
      }

      acc[item.idReference].listValues.push({
        idValue: item.idValue,
        valueName: item.valueName,
        idLink: item.idLink,
      });

      return acc;
    }, {} as Record<number, GoodValue>);
  }

  private expandChildrenForSelectedValues(
    currentResults: GoodValue[],
    referencesTree: ReferenceItem[]
  ): GoodValue[] {
    let result: GoodValue[] = [...currentResults];
    let index: number = 0;
    while (index < result.length) {
      const item: GoodValue = result[index];

      if (item.idReference !== GOOD_REF_ID) {
        const selectedValue = item.listValues?.[0];

        if (selectedValue?.idLink) {
          result = this.addChildrenFromValue(
            result,
            referencesTree,
            item,
            selectedValue.idValue
          );
        }
      }
      index++;
    }

    return result;
  }

  private updateExistingValuesWithLinks(
    item: GoodValue,
    treeValues: ValueItem[]
  ): GoodValue {
    return {
      ...item,
      listValues: (item.listValues ?? [])
        .filter((value) =>
          treeValues.some((treeValue) => treeValue.idValue === value.idValue) //оставляем только характеристики, которые есть в дереве
        )
        .map((value) => {
          const treeValue: ValueItem = treeValues.find(
            (x) => x.idValue === value.idValue
          );

          return {
            ...value,
            idLink: treeValue?.idLink,
          };
        }),
    };
  }
}
