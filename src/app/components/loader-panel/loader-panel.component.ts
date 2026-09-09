import { Component, OnInit, inject } from '@angular/core';
import { LoaderPanelService } from '../../services/loader-panel.service';
import { TranslateModule } from '@ngx-translate/core';
import { DxLoadPanelModule } from 'devextreme-angular';

@Component({
  selector: 'loader-panel',
  standalone: true,
  imports: [TranslateModule, DxLoadPanelModule],
  templateUrl: './loader-panel.component.html',
  styleUrls: ['./loader-panel.component.scss'],
})
export class LoaderPanelComponent implements OnInit {
  private readonly loaderPanelService = inject(LoaderPanelService);

  public loadingVisible = false;

  public ngOnInit(): void {
    // todo check for memory leaks (there is no unsubscribe)
    this.loaderPanelService.loaderSourceCalled$.subscribe((res) => {
      this.loadingVisible = res;
    });
  }
}
