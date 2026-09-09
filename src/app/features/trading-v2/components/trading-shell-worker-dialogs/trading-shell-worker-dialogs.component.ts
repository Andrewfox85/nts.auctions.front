/**
 * Диалоги воркера: допуск участников, подача заявок и передача в архив.
 */
import { LowerCasePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES, IdSessionPeriods, sessionStage } from '@constants';

@Component({
  selector: 'app-trading-shell-worker-dialogs',
  standalone: true,
  imports: [
    LowerCasePipe,
    ReactiveFormsModule,
    TranslateModule,
    ...DX_MODULES,
  ],
  templateUrl: './trading-shell-worker-dialogs.component.html',
})
export class TradingShellWorkerDialogsComponent {
  @Input() admissionVisible: boolean = false;
  @Input() admissionTitle: string | null = null;
  @Input({ required: true }) admissionForm!: FormGroup;
  @Input() sessionInfo: any;

  @Input() submissionVisible: boolean = false;
  @Input() submissionType: string = ' ';

  @Output() admissionClosed: EventEmitter<void> = new EventEmitter<void>();
  @Output() startAdmission: EventEmitter<void> = new EventEmitter<void>();
  @Output() submissionClosed: EventEmitter<void> = new EventEmitter<void>();
  @Output() archiveTransfer: EventEmitter<void> = new EventEmitter<void>();

  public readonly sessionStage: typeof sessionStage = sessionStage;
  public readonly IdSessionPeriods: typeof IdSessionPeriods = IdSessionPeriods;

  /** Закрывает диалог допуска по кнопке закрытия. */
  public onAdmissionClose(): void {
    this.admissionClosed.emit();
  }

  /** Закрывает диалог допуска по отмене. */
  public onAdmissionDismiss(): void {
    this.admissionClosed.emit();
  }

  /** Закрывает диалог подачи заявок по кнопке закрытия. */
  public onSubmissionClose(): void {
    this.submissionClosed.emit();
  }

  /** Закрывает диалог подачи заявок по отмене. */
  public onSubmissionDismiss(): void {
    this.submissionClosed.emit();
  }
}
