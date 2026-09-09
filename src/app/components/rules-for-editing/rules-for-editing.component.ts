import {
  Component,
  OnInit,
  inject,
  input,
  output,
} from '@angular/core';
import { TradingService } from '@services';
import { User } from '@classes';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ToastService } from '@services';
import { CommonModule } from '@angular/common';
import {
  DX_MODULES,
  editingRules,
  IdInterfaceField,
  IdSessionPeriods,
  PRODUCT_LEVELS_IN_BLOCK,
  MULTIBASIS_TYPE_ID
} from '@constants';
import { EnglishUpgradingAuctionStore } from '../../views/english-upgrading-auction/store/english-upgrading-auction-store';
import { EditRule } from "../../services/edit-demand-offer-service.service";
import { getTranslateResultByCurrentLang } from '@helpers';

@Component({
  selector: 'app-rules-for-editing',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './rules-for-editing.component.html',
  styleUrls: ['./rules-for-editing.component.scss'],
})
export class RulesForEditingComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  private readonly tradingService = inject(TradingService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastService = inject(ToastService);
  private readonly store = inject(EnglishUpgradingAuctionStore);

  public readonly fullInfo = input.required<any>();
  public readonly dataForReq = input.required<{sectionId: number, sessionId: number}>();
  public readonly onClose = output<boolean>();
  public readonly IdInterfaceField = IdInterfaceField;

  user: User;
  modelEditRules = [];
  fields: any;
  blocksFromModel = [];
  sessionRules = []

  public readonly rulesForm = this.formBuilder.group({});

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.tradingService
      .GetIntFields(this.user?.token, this.dataForReq().sectionId, this.store.idAuctionType())
      .then((res: any) => {
        this.fields = res.reduce(function (r, a) {
          //сгруппированы поля по interfaceFieldId
          r[a.interfaceFieldId] = r[a.interfaceFieldId] || [];
          r[a.interfaceFieldId].push(a);
          return r;
        }, {});

        this.tradingService.getEditRules(this.user?.token, this.dataForReq().sectionId, this.dataForReq().sessionId, this.fullInfo().modelInfo.id)
          .subscribe(res=>{
            this.sessionRules = res

        // каждый товар может быть из разного блока, нужно сделать поиск по блоку
        this.tradingService
          .Get(this.user?.token, this.fullInfo().modelInfo.id, this.dataForReq().sectionId)
          .subscribe((res: any) => {
            this.blocksFromModel= res.data.blocks;

            this.fullInfo().goods.forEach((good) => {
              let blockFind: any;
              this.blocksFromModel.forEach((block) => {
                block.products
                  .filter((prod) => prod.level == PRODUCT_LEVELS_IN_BLOCK.GOOD_NAME)
                  .forEach((item) => {
                    if (item.valueId == good.idGoodName) {
                      blockFind = block;
                      return;
                    }
                  });

                block.products
                  .filter((prod) => prod.level == PRODUCT_LEVELS_IN_BLOCK.GOOD_GROUP)
                  .forEach((item) => {
                    if (item.valueId == good.idGoodGroup) {
                      blockFind = block;
                      return;
                    }
                  });
                block.products
                  .filter((prod) => prod.level == PRODUCT_LEVELS_IN_BLOCK.NOMENCLATURE_GROUP)
                  .forEach((item) => {
                    if (item.valueId == good.idNomenclatureGroup) {
                      blockFind = block;
                      return;
                    }
                  });
              });

              let rulesSession = this.sessionRules.filter(el=> el.idModelBlock == blockFind.id)

              rulesSession.forEach((rule) => {
                /*при задании правил для поля 37 Базис поставки введено дополнительное ограничение в зависимости от признака многобазисности в модели:
            правила 8 добавление и 14 изменение и добавление исключаются, если признак многобазисных 2 только однобазисные;
            правило 13 изменение исключаются, если признак многобазисных 3 только многобазисные.*/
                if (rule.idInterfaceField == IdInterfaceField.deliveryTerms) {
                  if (res.data.multiBasisTypeId == MULTIBASIS_TYPE_ID.SINGLE_BASIS) {
                    this.fields[rule.idInterfaceField] = this.fields[
                      rule.idInterfaceField
                    ].filter((v) => v.editRuleId != editingRules.addingValueFromReferenceBook && v.editRuleId != editingRules.changingDeliveryConditionsAddingValue);
                  }
                   
                  if (res.data.multiBasisTypeId == MULTIBASIS_TYPE_ID.MULTIBASIS) {
                    this.fields[rule.idInterfaceField] = this.fields[
                      rule.idInterfaceField
                    ].filter((v) => v.editRuleId != editingRules.changesDeliveryTerms);
                  }
                }

                rule.value = this.fields[rule.idInterfaceField];
                let name =
                  blockFind.id +
                  '' +
                  rule.idInterfaceField +
                  '' +
                  rule.idSessionPeriod;

                this.rulesForm.addControl(
                  name.toString(),
                  this.formBuilder.control(rule.idEditRule, Validators.required)
                );
              });

             

              [IdSessionPeriods.pretrading, IdSessionPeriods.offersAdjustment].forEach(period => {
                const checkBoxName =
                  'checkbox_' + blockFind.id + 
                  IdInterfaceField.quantity +
                  '' +
                  period;
                const isCheckQuantityNotZero = rulesSession.find(rule => rule.idSessionPeriod === period
                  && rule.idInterfaceField === IdInterfaceField.quantity)
                  .isCheckQuantityNotZero

                this.rulesForm.addControl(
                  checkBoxName.toString(),
                  this.formBuilder.control(isCheckQuantityNotZero)
                );
              })

              rulesSession.sort((a, b) => {
                return a.idSessionPeriod - b.idSessionPeriod;
              });

              let rules = rulesSession.reduce(function (r, a) {
                //сгруппированы поля по interfaceFieldId
                r[a.idInterfaceField] = r[a.idInterfaceField] || [];
                r[a.idInterfaceField].push(a);
                return r;
              }, {});


              rules = Object.entries(rules);

              let infoGood: string = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'general.productServiceInformation'
                ),
                termsDeliveryTime = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'trading.offersTable.termsDeliveryTime'
                ),
                paymentDelivery = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'general.paymentDelivery'
                ),
                additionalOptions = getTranslateResultByCurrentLang(
                  this.translate.store.currentLang,
                  'general.additionalOptions'
                );

              let editRules = rules.reduce(function (r, a) {
                //сгруппированы поля по interfaceFieldId
                r[infoGood.toString()] = r[infoGood.toString()] || [];
                ['1', '3', '54', '56'].includes(a[0])
                  ? r[infoGood.toString()].push(a)
                  : null; //Информация о товаре/услуге
                r[termsDeliveryTime.toString()] =
                  r[termsDeliveryTime.toString()] || [];
                ['37'].includes(a[0])
                  ? r[termsDeliveryTime.toString()].push(a)
                  : null; //Условия поставки
                r[paymentDelivery.toString()] =
                  r[paymentDelivery.toString()] || [];
                ['36', '38', '39'].includes(a[0])
                  ? r[paymentDelivery.toString()].push(a)
                  : null; //Оплата и поставка
                r[additionalOptions.toString()] =
                  r[additionalOptions.toString()] || [];
                !['1', '3', '54', '56', '36', '37', '38', '39'].includes(a[0])
                  ? r[additionalOptions.toString()].push(a)
                  : null; //Дополнительные параметры
                return r;
              }, {});
              editRules = Object.entries(editRules);

              /*------ проверяем пустые массивы правил и удаляем эти значения из массива, чтобы они не отображались ------*/
              let k = [];
              editRules.forEach((el, index) => {
                if (el[1]?.length == 0) {
                  k.push(index);
                }
              });
              k.reverse().forEach((item) => editRules.splice(item, 1));

              let isAddedBlock = this.modelEditRules.findIndex(
                (el) => el.idBlock == blockFind.id
              );
              if (isAddedBlock == -1) {
                this.modelEditRules.push({
                  idBlock: blockFind.id,
                  goodName: good.goodName,
                  editRules: editRules,
                });
              } else {
                this.modelEditRules[isAddedBlock].goodName =
                  this.modelEditRules[isAddedBlock].goodName +
                  ', ' +
                  good.goodName;
              }
            });
          });
      });
  })
  }

  public onChangeValueRule(idBlock: number, rule: EditRule): void {
    const name =
      idBlock +
      '' +
      rule.idInterfaceField +
      '' +
      rule.idSessionPeriod;
    if (rule.idInterfaceField == IdInterfaceField.quantity &&
      this.rulesForm.get(name).value === editingRules.editingIsNotAvailable) {
      const checkBoxName =
        'checkbox_' + idBlock +
        IdInterfaceField.quantity +
        '' +
        rule.idSessionPeriod;
      this.rulesForm.get(checkBoxName).patchValue(false)
    }
  }

  public isDisabledCheckBox(idBlock: number, idSessionPeriod: number): boolean {
    const name =
      idBlock +
      '' +
      IdInterfaceField.quantity +
      '' +
      idSessionPeriod;
    return this.rulesForm.get(name)?.value === editingRules.editingIsNotAvailable
  }

  public onContentReady(e, array): void {
    for (var i = 0; i < array.length; i++) {
      e.component.expandItem(i);
    }
  }

  public clearBlock(e, good, item): void {
    e.event.stopPropagation();
    item[1].forEach((rules) => {
      rules[1].forEach((rule) => {
        let name =
          good.idBlock + '' + rule.idInterfaceField + '' + rule.idSessionPeriod;
        this.rulesForm.get(name.toString()).reset();
      });
    });
  }

  public onSaveRules(e) {
    let result = e.validationGroup.validate();
    if (result.isValid) {
      let array = [];
      this.modelEditRules.forEach((good) => {
        good.editRules.forEach((rules) => {
          rules[1].forEach((rule) => {
            rule[1].forEach((r) => {
              const name =
                good.idBlock + '' + r.idInterfaceField + '' + r.idSessionPeriod;
              const checkBoxName =
                'checkbox_' + good.idBlock +
                IdInterfaceField.quantity +
                '' +
                r.idSessionPeriod;
              array.push({
                idModel: r.idModel,
                idModelBlock: r.idModelBlock,
                idSession: Number(this.dataForReq().sessionId),
                idSessionPeriod: r.idSessionPeriod,
                idInterfaceField: r.idInterfaceField,
                idEditRule: this.rulesForm.get(name.toString()).value,
                isCheckQuantityNotZero:  r.idInterfaceField === IdInterfaceField.quantity ?
                  this.rulesForm.get(checkBoxName.toString())?.value : false
              });
            });
          });
        });
      });

      this.blocksFromModel.forEach((block) => {       //проходимся по блокам модели и выясняем, какого блока не было в modelEditRules
        if (!array.find(el => el.idModelBlock == block.id)) {
          let rules = block.editRules.map(el => ({
            ...el,
            idSession: Number(this.dataForReq().sessionId)
          }))
          array = [...array, ...rules]                     //добавляем в массив правил существующие правила из других блоков
        }
      })

      const body = {
        editRules: array,
      };
      this.tradingService
        .SetEditRules(this.user?.token, this.dataForReq().sectionId, body)
        .subscribe((res: any) => {
          let message: string = getTranslateResultByCurrentLang(this.translate.store.currentLang, 'trading.auctionsTab.rulesForEditingSave');

          this.toastService.onShowToast({
            message: message,
            type: 'success',
          });
          this.onClose.emit(true);
        });
    }
  }
}
