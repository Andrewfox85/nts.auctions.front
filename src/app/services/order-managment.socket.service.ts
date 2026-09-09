import { Injectable, inject } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from '@microsoft/signalr';
import { AppConfigService } from '@services';
import { LocalStorageService } from '@shared-services';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { User } from '@classes';

export interface FilesDataExportedPayload {
  fileId: number;
  fileName: string;
  exportTime: string;
}

@Injectable({ providedIn: 'root' })
export class OrderManagementSignalRService {
  private readonly config = inject(AppConfigService);
  private readonly cookieService = inject(CookieService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly socketsUrl = this.config.sockets;
  private hubConnection!: HubConnection;

  private readonly connectionState$ = new BehaviorSubject<boolean>(false);
  private readonly filesDataExported$ = new Subject<FilesDataExportedPayload>();

  public get isConnected$(): Observable<boolean> {
    return this.connectionState$.asObservable();
  }

  public get filesExported$(): Observable<FilesDataExportedPayload> {
    return this.filesDataExported$.asObservable();
  }

  public async connect(): Promise<void> {
    const token =
      this.cookieService.get('UasToken') ||
      (
        (this.localStorageService.getItemFromLocalStorage('user') as User) ||
        ({} as User)
      )?.token;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${this.socketsUrl}hub/om/chat`, {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([1000, 3000, 5000, 10000])
      .configureLogging(LogLevel.Information)
      .build();

    this.registerEvents();

    try {
      await this.hubConnection.start();
      this.connectionState$.next(true);
    } catch (error) {
      this.connectionState$.next(false);
      console.error('[SignalR] Connection failed:', error);
    }
  }

  private registerEvents(): void {
    this.hubConnection.on(
      'FilesDataExported',
      (data: FilesDataExportedPayload) => {
        this.filesDataExported$.next(data);
      }
    );

    this.hubConnection.onclose((error) => {
      this.connectionState$.next(false);
      console.warn('[SignalR] Connection closed:', error);
    });
  }

  public disconnect(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.connectionState$.next(false);
    }
  }
}
