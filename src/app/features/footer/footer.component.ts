import { Component, inject, Signal, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { ApiStore } from '@store';
import { SECTIONS_TYPES } from '../header/enums';
import { IApiDataSection } from '@interfaces';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [TranslateModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  private readonly apiStore = inject(ApiStore);

  public buildNumber = signal('');
  public currentYear = signal(new Date().getFullYear());
  public readonly sections: Signal<Array<IApiDataSection>> = this.apiStore.sectionsList;
  public readonly sectionsTypes = SECTIONS_TYPES;

  constructor() {
    this.buildNumber.set(environment.buildNumber || '');
  }

  public getSectionNameByType(type: SECTIONS_TYPES): string {
    return (
      this.sections().find((section: IApiDataSection): boolean => Number(section.id) === type)?.name ?? ''
    );
  }
}
