import { Component, Input, inject } from '@angular/core';
import { downloadFile } from '@helpers';
import { DocumentsService, GeneralInfo, Documents } from '@services';
import { TranslateModule } from '@ngx-translate/core';
import { NgStyle } from '@angular/common';
import { IGeneralInfo } from '../../../../shared/interfaces/index';
import { GetOfferDocumentResponse } from '../../../../services/documents-service/shared/interfaces/index';
import { IdDirection } from '@constants';

@Component({
  selector: 'app-offers-additional-info',
  imports: [TranslateModule, NgStyle],
  templateUrl: './offers-additional-info.component.html',
  styleUrl: './offers-additional-info.component.scss',
  standalone: true,
})
export class OffersAdditionalInfoComponent {
  @Input() generalInfo: GeneralInfo | IGeneralInfo;
  @Input() documents: Documents[] = [];
  @Input() userToken: string;
  @Input() directSession: boolean = false;

  private readonly documentsService = inject(DocumentsService);

  public additionalInfo: boolean = true;
  public additionalCondHidden: boolean = false;

  public checkIsPrivateDocuments(): boolean {
    return this.documents?.some((file) => file.isPrivate === true);
  }

  public checkNoPrivateDocuments(): boolean {
    return this.documents?.some((file) => file.isPrivate === false);
  }

  public downloadDoc(file: Documents): void {
    let directionId: number = !this.directSession
      ? this.generalInfo.directionId
      : IdDirection.sale; //в адресной сессии вседа на продажу

    this.documentsService
      .getOfferDocumentContent(
        this.userToken,
        file.idDemandOffer,
        file.idDocument,
        directionId
      )
      .subscribe((res: GetOfferDocumentResponse) => {
        downloadFile(res.content, file.filename);
      });
  }

  public toggleAdditionalCondHidden(): void {
    this.additionalCondHidden = !this.additionalCondHidden;
  }

  public toggleAdditionalInfo(): void {
    this.additionalInfo = !this.additionalInfo;
  }
}
