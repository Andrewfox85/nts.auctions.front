import { Component, model, input, output } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-additional-info-deal',
  imports: [TranslateModule],
  templateUrl: './additional-info-deal.component.html',
  styleUrl: './additional-info-deal.component.scss',
})
export class AdditionalInfoDealComponent {
  public readonly generalInfo = input.required<any>();
  public readonly documents = input.required<any>();

  public readonly downloadDoc = output<any>();

  public readonly addInfo = model(false);

  public changeAddInfo(): void {
    this.addInfo.set(!this.addInfo());
  }

  public checkIsPrivateDocuments(): boolean {
    return this.documents()?.some((file) => file.isPrivate == true);
  }

  public checkNoPrivateDocuments(): boolean {
    return this.documents()?.some((file) => file.isPrivate == false);
  }

  public download(file: any): void {
    this.downloadDoc.emit(file);
  }
}
