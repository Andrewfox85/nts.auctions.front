import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { ExportingEvent } from 'devextreme/ui/data_grid';
import { Cell } from 'exceljs';
import { getTranslateResultByCurrentLang } from '@helpers';
import { TranslateService } from '@ngx-translate/core';
import { FileTypes, AgreementType } from './../shared/constants/api.constants';
import {
  EXCEL_DATE_OFFSET_1900,
  SECONDS_IN_MINUTE,
  MINUTES_IN_HOUR,
  HOURS_IN_DAY,
  MS_IN_SECOND,
} from './../views/homepage/constants/index';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor(private translate: TranslateService) {}

  public onExporting(e: ExportingEvent, fileName: string, type: string): void {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('DataGrid');
    const columnCount = e.component.getVisibleColumns().length;
    worksheet.columns = Array.from({ length: columnCount }, () => ({
      width: 30,
    }));

    exportDataGrid({
      component: e.component,
      worksheet,
      keepColumnWidths: false,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          const row = worksheet.getRow(excelCell.fullAddress.row);
          row.height = 30;

          const field: string = gridCell.column.dataField;

          if (type === FileTypes.DEALS) {
            // колонки которые нужно разделять на строки
            const multilineFields = [
              'names',
              'desc',
              'vol',
              'units',
              'amendment',
              'quotation',
              'prices',
              'amountVAT',
              'totalAmount',
              'place',
            ];
            if (multilineFields.includes(field)) {
              this.makeGoodsColumns(excelCell, gridCell.value);
            }

            this.makeDealsGrid(excelCell, gridCell);
          }

          if (type === FileTypes.BIDDING_PROCESS) {
            this.makeBiddingProcessGrid(excelCell, gridCell);
          }
        }
      },
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(
          new Blob([buffer], { type: 'application/octet-stream' }),
          `${fileName}.xlsx`
        );
      });
    });
    e.cancel = true;
  }

  //формируем потоварную колонку для выгрузки в ексель (значения массива будут переносится на новую строку в одной ячейке для лучшей читаемости)
  private makeGoodsColumns(excelCell: Cell, value: string[]): void {
    if (Array.isArray(value)) {
      excelCell.value = value.join('\r\n');
    } else {
      excelCell.value = value;
    }

    excelCell.alignment = {
      wrapText: true,
      vertical: 'top',
    };
  }

  private excelToJSDate(excelDate: number): Date {
    const date = new Date(
      Math.round(
        (excelDate - EXCEL_DATE_OFFSET_1900) *
          SECONDS_IN_MINUTE *
          MINUTES_IN_HOUR *
          HOURS_IN_DAY *
          MS_IN_SECOND
      )
    );
    const userOffset =
      date.getTimezoneOffset() * SECONDS_IN_MINUTE * MS_IN_SECOND;
    return new Date(date.getTime() + userOffset);
  }

  private makeDealsGrid(excelCell: Cell, gridCell): void {
    let commissionText = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.commissionAgreement'
    );

    let agencyText = getTranslateResultByCurrentLang(
      this.translate.store.currentLang,
      'general.agencyAgreement'
    );

    if (gridCell.column.dataField === 'buyerInfo.buyerIdClientContractType') {
      excelCell.value =
        gridCell.data.buyerInfo.buyerIdClientContractType ==
        AgreementType.Commission
          ? commissionText
          : gridCell.data.buyerInfo.buyerIdClientContractType ==
            AgreementType.Agency
          ? agencyText
          : '';
    }

    if (gridCell.column.dataField === 'sellerInfo.sellerIdClientContractType') {
      excelCell.value =
        gridCell.data.sellerInfo.sellerIdClientContractType ==
        AgreementType.Commission
          ? commissionText
          : gridCell.data.sellerInfo.sellerIdClientContractType ==
            AgreementType.Agency
          ? agencyText
          : '';
    }

    if (gridCell.column.dataField === 'dateTerminate') {
      let dateTerminateToDoc = this.excelToJSDate(gridCell.data.dateTerminate);
      excelCell.value = dateTerminateToDoc.toLocaleString();
    }

    if (gridCell.column.dataField === 'transactionInfo.transactionDatetime') {
      let transactionDatetimeToDoc = this.excelToJSDate(
        gridCell.data.transactionInfo.transactionDatetime
      );
      excelCell.value = transactionDatetimeToDoc.toLocaleString();
    }

    if (gridCell.column.dataField === 'exchangeFeeInfo.exchFeeSellerTotalAmount') {
      excelCell.value = `${gridCell.data.exchangeFeeInfo.exchFeeSellerTotalAmount} ${gridCell.data.exchangeFeeInfo.exchFeeSellerCurrencyName}`
    }

    if (gridCell.column.dataField === 'exchangeFeeInfo.exchFeeBuyerTotalAmount') {
      excelCell.value = `${gridCell.data.exchangeFeeInfo.exchFeeBuyerTotalAmount} ${gridCell.data.exchangeFeeInfo.exchFeeBuyerCurrencyName}`
    } 
  }

  private makeBiddingProcessGrid(excelCell: Cell, gridCell): void {
    if (gridCell.column.dataField === 'dateTimeActivate') {
      let dateTimeActivateToDoc = this.excelToJSDate(
        gridCell.data.dateTimeActivate
      );
      excelCell.value = dateTimeActivateToDoc.toLocaleString();
    }

    if (
      gridCell.column.dataField === 'dateTimeDeActivate' &&
      gridCell.data.dateTimeDeActivate
    ) {
      let dateTimeDeActivateToDoc = this.excelToJSDate(
        gridCell.data.dateTimeDeActivate
      );
      excelCell.value = dateTimeDeActivateToDoc.toLocaleString();
    }
  }
}
