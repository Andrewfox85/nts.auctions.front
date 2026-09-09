import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslateModule} from "@ngx-translate/core";
import {
  DxSelectBoxComponent,
  DxTextBoxComponent,
  DxValidatorComponent
} from "devextreme-angular";
import {DxiValidationRuleComponent} from "devextreme-angular/ui/nested";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { IReferences } from '../../../views/homepage/interfaces';

@Component({
  selector: 'app-additional-purchase-fields',
  imports: [
    TranslateModule,
    DxSelectBoxComponent,
    DxValidatorComponent,
    DxiValidationRuleComponent,
    DxTextBoxComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './additional-purchase-fields.component.html',
  styleUrl: './additional-purchase-fields.component.scss',
  standalone: true
})
export class AdditionalPurchaseFieldsComponent {
  @Input({required: true}) vatDataSource: IReferences[];

  // @Input({required: true}) locationGoodDataSource: IReferences[];

  @Input({required: true}) vatValue: number;

  @Input({required: true}) amountVAT: string;

  // @Input({required: true}) productLocation: number;

  @Output() changedSelect =new EventEmitter<{
    id: number;
    nameVariable: string;
  }>();

  public onChangedSelect(id: number, nameVariable: string){
    this.changedSelect.emit({ id, nameVariable})
  }

}
