import {
  Component,
  model,
  input,
  inject,
  output,
  computed,
  ChangeDetectionStrategy,
  effect,
  DestroyRef,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IInfoForEdit } from '../../interfaces/index';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-buyer-deal-english-auction',
  imports: [
    TranslateModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxValidatorModule,
    DxFormModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './buyer-deal-english-auction.component.html',
  styleUrl: './buyer-deal-english-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BuyerDealEnglishAuctionComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  public readonly generalInfo = input.required<any>(); //IT's impossible for me
  public readonly infoForEdit = input.required<IInfoForEdit[]>();
  
  public readonly chooseClient = output<number>();

  public readonly buyerInformationHidden = model(false);

  public readonly selectedType = signal<string>(null);

  public readonly selectedClientIdSignal = signal<number>(null);

  public readonly separatedData = computed(() => {
    const items = this.infoForEdit() ?? [];

    return items.reduce(
      (acc, currentItem) => {
        if (currentItem.idFirmClient !== null) {
          acc.brokerList.push(currentItem);
        } else {
          acc.visitorList.push(currentItem);
        }
        return acc;
      },
      {
        brokerList: [] as IInfoForEdit[],
        visitorList: [] as IInfoForEdit[],
      }
    );
  });

  public readonly brokerList = computed(() => this.separatedData().brokerList);
  public readonly visitorList = computed(
    () => this.separatedData().visitorList
  );

  public readonly uniqueFirmClients = computed(() => {
    const brokers = this.brokerList();
    const seen = new Set();
    return brokers.filter((item) => {
      if (seen.has(item.idFirmClient)) return false;
      seen.add(item.idFirmClient);
      return true;
    });
  });

  public readonly branchDataSource = computed(() => {
    const type = this.selectedType();

    if (type === 'visitor') {
      return this.visitorList();
    }

    if (type === 'broker') {
      const selectedClientId = this.selectedClientIdSignal();
      if (!selectedClientId) return [];
      return this.brokerList().filter(
        (item) =>
          item.idFirmClient === selectedClientId && item.idBranch !== null
      );
    }

    return [];
  });

  public readonly selectedClientHasNoBranches = computed(() => {
    const clientId = this.selectedClientIdSignal();
    if (!clientId) return false;

    return this.brokerList().some(
      (item) => item.idFirmClient === clientId && item.idBranch === null
    );
  });

  public readonly editForm = this.formBuilder.group({
    buyerIdClientNew: new FormControl(null),
    buyerIdBranchNew: new FormControl(null),
    textReason: new FormControl(null, [Validators.required]),
  });

  constructor() {
    effect(() => { 
      if (!this.selectedType()) {
        if (this.brokerList()?.length > 0) {
          this.onTypeChange('broker');
        } else if (this.visitorList()?.length > 0) {
          this.onTypeChange('visitor');
        }
      }

      const clientControl = this.editForm.get('buyerIdClientNew');
      const branchControl = this.editForm.get('buyerIdBranchNew');
      const hasNoBranches = this.selectedClientHasNoBranches();
      const visitorHasBranches = this.visitorList()?.every(
        (item) => item.idBranch !== null
      );

      if (this.selectedType() === 'broker') {
        clientControl.setValidators([Validators.required]);
      } else {
        clientControl.clearValidators();
      }

      clientControl.updateValueAndValidity({ emitEvent: false });

      if (
        (this.selectedType() === 'broker' && !hasNoBranches) ||
        (this.selectedType() === 'visitor' && visitorHasBranches)
      ) {
        branchControl.setValidators([Validators.required]);
      } else {
        branchControl.clearValidators();
      }

      branchControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  public changeBuyerInformationHidden(): void {
    this.buyerInformationHidden.set(!this.buyerInformationHidden());
  }

  public onChooseClient(value: number): void {
    this.selectedClientIdSignal.set(value);
    this.editForm.get('buyerIdBranchNew').reset();
    this.chooseClient.emit(value);
  }

  public onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.editForm.patchValue({
      buyerIdClientNew: null,
      buyerIdBranchNew: null,
    });
  }
}
