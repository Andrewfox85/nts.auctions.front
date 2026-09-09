import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { DX_MODULES } from '@constants';
import { User } from '@classes';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-message-popup',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...DX_MODULES,
  ],
  templateUrl: './message-popup.component.html',
  styleUrls: ['./message-popup.component.scss'],
})
export class MessagePopupComponent implements OnInit {
  @Input() messagePopup;
  @Input() messageString;
  @Output() close = new EventEmitter<any>();

  user: User;

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }

  closePopup() {
    this.close.emit(false);
  }
}
