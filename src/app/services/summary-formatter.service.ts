import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { createRuSummaryFormatter, createTotalBasedTextCacheKey } from '@helpers';

@Injectable({
  providedIn: 'root',
})
export class SummaryFormatterService {
  private readonly totalBasedTextCache = new Map<string, ({ value }: { value: number }) => string>();

  constructor(private readonly translate: TranslateService) {}

  // форматтер для summary с использованием кэшированных функций
  // кэш функций используется на каждый change detection чтобы не создавать новую такую же
  public getTotalBasedCustomizeText(
    translateKey: string, currency: string, precision: number
  ): ({ value }: { value: number }) => string {
    const cacheKey: string = createTotalBasedTextCacheKey(translateKey, this.translate.currentLang, currency, precision);
    const cachedFormatter = this.totalBasedTextCache.get(cacheKey);

    if (cachedFormatter) {
      return cachedFormatter;
    }

    const formatter = createRuSummaryFormatter(
      this.translate.instant(translateKey),
      currency,
      precision
    );
    this.totalBasedTextCache.set(cacheKey, formatter);
    return formatter;
  }
}
