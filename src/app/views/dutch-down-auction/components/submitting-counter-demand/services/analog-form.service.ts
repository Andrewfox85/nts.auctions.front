import { Injectable, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  Validators,
  FormGroup,
} from '@angular/forms';
import { GOOD_REF_ID, TREE_LEVELS } from './../constants';
import { GoodValue, ValueItem } from './../interfaces';
import {
  ReferenceItem,
  GoodNames,
} from './../../../../../services/counter-service/shared/interfaces/index';

@Injectable({
  providedIn: 'root',
})
export class AnalogFormService {
  private readonly formBuilder = inject(FormBuilder);

  public createGoodForm(
    goodValues: GoodValue[],
    selectedName: { [key: number]: number } = {}
  ): FormGroup {
    goodValues.sort((a, b) =>
      a.idReference === GOOD_REF_ID ? -1 : b.idReference === GOOD_REF_ID ? 1 : 0
    );
    const formControls: { [key: string]: FormControl } = {};
    goodValues.forEach((item) => {
      //для наименования устанавливаем выбранное значение в заявке, если в заявке был множ. выбор - первое по списку
      let defaultValue: number | null;

      if (selectedName[item.idReference]) {
        defaultValue = selectedName[item.idReference];
      } else if (!item.valuesFromNsi) {
        defaultValue = item.listValues?.[0]?.idValue;
      } else {
        defaultValue = null;
      }

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
  //если характеристика есть в goodValues, но нет в referencesTree удаляем
  //если характеристика есть в referencesTree, но нет в goodValues добавляем
  public buildGoodValues(
    goodValues: GoodValue[],
    referencesTree: ReferenceItem[],
    goodNames: GoodNames[]
  ): GoodValue[] {
    //берем только наименование и его детей
    const firstLevelRefs: ReferenceItem[] = referencesTree.filter(
      (ref) => ref.lvl === TREE_LEVELS.SECOND
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
      //отдельно обрабатываем наименование (берем из goodNames)
      if (item.idReference === GOOD_REF_ID) {
        result.push({
          ...item,
          listValues: goodNames.map((name) => ({
            idValue: name.id,
            valueName: name.name,
            idLink: name.idLink,
          })),
          parentIdReference: null,
          idLink: null,
          idLinkParent: null,
          level: TREE_LEVELS.FIRST,
        });

        return;
      }

      const treeItem: GoodValue = treeValues[item.idReference];

      if (!treeItem) {
        return;
      }

      /* строим характеристику
          если shouldTakeTreeValues - true:
          обновляем listValues через updateItemValues (это будут НСИ характеристики) - детей не раскрываем, тк пользователь должен сам выбрать нужное
          если shouldTakeTreeValues - false:
          оставляем значения из заявки - берём первый выбранный элемент - ищем его детей и добавляем сразу в отображаение */
      const shouldTakeTreeValues: boolean =
        !item.listValues ||
        (item.listValues.length === 1 && item.isAllowAnalogs);

      const updatedItem: GoodValue = shouldTakeTreeValues
        ? this.updateItemValues(item, treeItem.listValues)
        : this.updateExistingValuesWithLinks(item, treeItem.listValues);

      result.push({
        ...updatedItem,
        parentIdReference: treeItem.parentIdReference,
        level: treeItem.level,
      });
    });

    //добавляем новые характеристики первого уровня которых не было в заявке
    result = this.addNewTreeItems(result, treeValues);

    //раскрываем детей сразу, если характеритика предазполнена 1 значением
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

    const newChildren: GoodValue[] = Object.values(grouped).map((item) =>
      this.updateItemValues(item, item.listValues)
    );

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
          isAllowAnalogs: true,
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

  private addNewTreeItems(
    currentResults: GoodValue[],
    treeValues: Record<number, GoodValue>
  ): GoodValue[] {
    const result: GoodValue[] = [...currentResults];

    Object.values(treeValues).forEach((treeItem) => {
      const exists: boolean = result.some(
        (item) => item.idReference === treeItem.idReference
      );

      if (!exists) {
        let newItem: GoodValue = {
          idReference: treeItem.idReference,
          referenceName: treeItem.referenceName,
          listValues: [],
          isAllowAnalogs: true,
          parentIdReference: treeItem.parentIdReference,
          idLink: treeItem.idLink,
          idLinkParent: treeItem.idLinkParent,
          level: treeItem.level,
        };

        newItem = this.updateItemValues(newItem, treeItem.listValues);
        result.push(newItem);
      }
    });

    return result;
  }

  private expandChildrenForSelectedValues(
    currentResults: GoodValue[],
    referencesTree: ReferenceItem[]
  ): GoodValue[] {
    let result: GoodValue[] = [...currentResults];
    let index: number = 0;

    while (index < result.length) {
      const item: GoodValue = result[index];

      if (item.idReference !== GOOD_REF_ID && !item.valuesFromNsi) {
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

  private updateItemValues(item: GoodValue, values: ValueItem[]): GoodValue {
    return {
      ...item,
      listValues: [...values],
      valuesFromNsi: true, //параметр, чтоб отличить что значения хар-ки из НСИ. Справочники со значениями из НСИ !НИКОГДА! не блочаться
    };
  }

  private updateExistingValuesWithLinks(
    item: GoodValue,
    treeValues: ValueItem[]
  ): GoodValue {
    
    return {
      ...item,
      listValues: (item.listValues ?? [])
        .filter(
          (value) =>
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

  //проверка валидности дерева для блокировки кнопки "добавить товар"
  public isTreeCompleted(
    goodValues: GoodValue[],
    referencesTree: ReferenceItem[],
    form: FormGroup
  ): boolean {
    return goodValues.every((item) =>
      this.isItemValueValid(item, goodValues, referencesTree, form)
    );
  }

  private isItemValueValid(
    item: GoodValue,
    goodValues: GoodValue[],
    referencesTree: ReferenceItem[],
    form: FormGroup
  ): boolean {
    //наименование всегда валидно
    if (item.idReference === GOOD_REF_ID) {
      return true;
    }

    const value: number = form.controls[item.idReference.toString()]?.value;

    //характеристика не заполнена
    if (value === null) {
      return false;
    }

    const selectedValue: ValueItem = item.listValues?.find(
      (el) => el.idValue === value
    );

    if (!selectedValue) {
      return false;
    }

    //проверяем есть ли дети у выбранного значения и если нет - это последний уровень
    const hasChildren: boolean = referencesTree.some(
      (ref) => ref.idLinkParent === selectedValue.idLink
    );
    if (!hasChildren) {
      return true;
    }

    //если дети есть они должны быть добавлены в goodValues
    const children: GoodValue[] = goodValues.filter(
      (child) => child.parentIdReference === item.idReference
    );
    if (children.length === 0) {
      return false;
    }

    //проверяем заполненность детей
    return children.every((child) => {
      const childControlValue: number =
        form.controls[child.idReference.toString()]?.value;
      return childControlValue !== null;
    });
  }
}
