import { Injectable, inject, DestroyRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable()
export class AppService {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  public subscribeOnLanguageChange(): void {
    this.translate
      .stream('filters.gridFiltersText')
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((val) => {
        document.documentElement.style.setProperty(
          '--grid-filter-text',
          `"${val}"`
        );
      });
  }
}
