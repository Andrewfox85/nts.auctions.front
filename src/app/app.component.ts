import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent, FooterComponent, SidebarComponent, PopupSidebarComponent } from '@features';
import {
  ToastComponent,
  ErrorPopupComponent,
  LoaderPanelComponent,
} from '@components';
import { AppService } from './app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    PopupSidebarComponent,
    HeaderComponent,
    ToastComponent,
    RouterOutlet,
    ErrorPopupComponent,
    LoaderPanelComponent,
    FooterComponent,
    SidebarComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [AppService],
})
export class AppComponent implements OnInit {
  public isOpenChat = signal(false);
  private readonly connect = inject(AppService);

  constructor() {
    this.connect.subscribeOnLanguageChange();
  }

  public ngOnInit(): void {
    this.isOpenChat.set(location.pathname.includes('/chat'));
  }
}
