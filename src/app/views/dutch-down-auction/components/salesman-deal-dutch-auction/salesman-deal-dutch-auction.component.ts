import {
  Component,
  inject,
  input,
  output,
  model,
  computed,
  ChangeDetectionStrategy,
  effect,
  signal,
  DestroyRef,
  untracked,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import {
  DxFormModule,
  DxSelectBoxModule,
  DxTextAreaModule,
  DxValidatorModule,
} from 'devextreme-angular';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonService } from '@services';
import { map } from 'rxjs/operators';
import { IInfoForEdit } from '../../interfaces';
import { PARTICIPANT_TYPES } from '@constants';
import { VALUE_WITHOUT_VAT_ID } from './../submitting-counter-demand/constants/index';


export interface RefBook {
  id: string;
  name: string;
  description: string | null;
}
@Component({
  selector: 'app-salesman-deal-dutch-auction',
  standalone: true,
  imports: [
    TranslateModule,
    DxFormModule,
    DxSelectBoxModule,
    DxTextAreaModule,
    DxValidatorModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './salesman-deal-dutch-auction.component.html',
  styleUrl: './salesman-deal-dutch-auction.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesmanDealDutchAuctionComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly generalInfo = input.required<any>();
  public readonly vatField = input.required<number>();
  public readonly infoForEdit = input.required<IInfoForEdit[]>();
  public readonly chooseClient = output<number>();
  public readonly sellerInformationHidden = model(false);
  public readonly changeVat = output<string>();

  public readonly PARTICIPANT_TYPES = PARTICIPANT_TYPES;

  public isFormPreFilled: boolean = false;

  public readonly editForm = this.formBuilder.group({
    sellerIdClientNew: new FormControl(null),
    sellerIdBranchNew: new FormControl(null),
    vatPercent: new FormControl(null),
    absoluteVatPercent: new FormControl(null),
    textReason: new FormControl(null, [Validators.required]),
  });

  public readonly isClientBracnhRequired = signal<boolean>(false);

  private get userToken(): string {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw).token : '';
  }

  public readonly vatRatePercents = toSignal(
    this.commonService
      .getByName(this.userToken, 'vatpercents')
      .pipe(map((res: { refbooks: RefBook[] }) => res.refbooks))
  );

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

  constructor() {
    effect(() => {

      if (!this.selectedType()) {
        if (this.brokerList()?.length > 0) {
          this.onTypeChange('broker');
        } else if (this.visitorList()?.length > 0) {
          this.onTypeChange('visitor');
        }
      }
    });

    effect(() => {
      if (this.isFormPreFilled) {
        return;
      }
  
      if (!this.vatRatePercents()) {
        return;
      }

      const general: any = this.generalInfo();
      const vat: number = this.vatField();
      const clientsList: IInfoForEdit[] = this.uniqueFirmClients();
      const branchesList: IInfoForEdit[] = this.branchDataSource();

      const isClientReady: boolean = clientsList.some(
        (item) => item.idFirmClient === general?.sellerInfo?.sellerIdClient
      );
      const isBranchReady: boolean =
        branchesList?.length > 0 &&
        branchesList.some(
          (item) => item.idBranch === general?.sellerInfo?.sellerIdBranch
        );

      if (isClientReady || isBranchReady) {
        untracked(() => {
          this.selectedClientIdSignal.set(general?.sellerInfo?.sellerIdClient);

          this.editForm.patchValue(
            {
              sellerIdClientNew: general?.sellerInfo?.sellerIdClient,
              sellerIdBranchNew: general?.sellerInfo?.sellerIdBranch,
              vatPercent: vat?.toString(),
              absoluteVatPercent: this.getAbsoluteValueById(vat?.toString()),
            },
            { emitEvent: false }
          );

          this.isFormPreFilled = true;
        });
      }
    });

    effect(() => {
      const branchControl = this.editForm.get(
        'sellerIdBranchNew'
      ) as FormControl<number>;
      const clientControl = this.editForm.get(
        'sellerIdClientNew'
      ) as FormControl<number>;
      const hasNoBranches: boolean = this.selectedClientHasNoBranches();
      const visitorHasBranches: boolean = this.visitorList()?.every(
        (item) => item.idBranch !== null
      );

      if (!clientControl || !branchControl) return;

      if (this.selectedType() === 'broker') {
        clientControl.setValidators([Validators.required]);
      } else {
        clientControl.clearValidators();
      }

      if (
        (this.selectedType() === 'broker' && !hasNoBranches) ||
        (this.selectedType() === 'visitor' && visitorHasBranches)
      ) {
        branchControl.setValidators([Validators.required]);
      } else {
        branchControl.clearValidators();
      }

      untracked(() => {
        clientControl.updateValueAndValidity({ emitEvent: false });
        branchControl.updateValueAndValidity({ emitEvent: false });
      });
    });
  }

  public changeSellerInformationHidden(): void {
    this.sellerInformationHidden.set(!this.sellerInformationHidden());
  }

  public onChooseClient(value: number): void {
    this.selectedClientIdSignal.set(value);
    this.editForm.get('sellerIdBranchNew').reset();
    this.chooseClient.emit(value);
  }

  public onChangeVat(value: string): void {
    if (this.editForm.dirty) {
      this.editForm.get('absoluteVatPercent').patchValue(this.getAbsoluteValueById(value));
      this.changeVat.emit(value);
    }
  }

  public onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.editForm.patchValue({
      sellerIdClientNew: null,
      sellerIdBranchNew: null,
    }, { emitEvent: false });
  }

  private getAbsoluteValueById(id: string): string {
    const foundName: string = this.vatRatePercents().find((item) => item.id === id)?.name;

    if (foundName === VALUE_WITHOUT_VAT_ID) {
      return null;
    }

    return foundName.replace('%', '').trim();
  }
}
