import { CommonModule } from '@angular/common';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { DX_MODULES } from '@constants';

@Component({
    selector: 'app-check-activation-mode',
    standalone: true,
    imports: [CommonModule, TranslateModule, ...DX_MODULES],
    templateUrl: './check-activation-mode.component.html',
    styleUrls: ['./check-activation-mode.component.scss']
})
export class CheckActivationModeComponent implements OnInit {
  @Input() tradeTypeId;
  @Input() title;
  @Output() onContinue = new EventEmitter<boolean>();
  constructor() { }

  ngOnInit(): void {
  }
}
