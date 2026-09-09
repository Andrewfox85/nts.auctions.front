import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { sessionStage } from '@constants';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '@classes';
import { DatePipe } from '@angular/common';
import { ExcelDatePipe } from '@pipes';
import { DxDataGridModule } from 'devextreme-angular';
import { DxGridContextMenuLocalizationDirective } from '../../shared/directives';

@Component({
  selector: 'app-detail-info',
  standalone: true,
  imports: [
    DatePipe,
    ExcelDatePipe,
    TranslateModule,
    DxDataGridModule,
    DxGridContextMenuLocalizationDirective
  ],
  templateUrl: './detail-info.component.html',
  styleUrls: ['./detail-info.component.scss'],
})
export class DetailInfoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  public outputArray;
  public session;
  public nameSessionStage: string;
  public sessionStage = sessionStage;
  public user: User;
  public title: string;

  constructor(
  ) {
    this.route.queryParams.subscribe((i) => {
      this.outputArray = JSON.parse(i['json']);
      this.session = JSON.parse(i['session']);
      this.title = i['title'];
    });
  }

  public ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
  }
}
