import { DestroyRef, Directive, inject } from '@angular/core';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { locale } from 'devextreme/localization';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GRID_MENU_TRANSLATIONS, TARGET_HEADER, RU_LOCALE } from '../constants';
import { ContextMenuItem } from '../interfaces';

@Directive({
  selector: 'dx-data-grid[appLocalizeContextMenu]',
  standalone: true,
})
export class DxGridContextMenuLocalizationDirective {
  private readonly grid = inject(DxDataGridComponent);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    if (locale() !== RU_LOCALE) return;

    this.grid.onContextMenuPreparing
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.target === TARGET_HEADER && Array.isArray(event.items)) {
          event.items = this.localizeItems(event.items);
        }
      });
  }

  private localizeItems(items: ContextMenuItem[]): ContextMenuItem[] {
    return items.map((item) => {
      const localizedText =
        item.text && GRID_MENU_TRANSLATIONS[item.text]
          ? GRID_MENU_TRANSLATIONS[item.text]
          : item.text;

      const localizedSubItems = item.items
        ? this.localizeItems(item.items)
        : undefined;

      return {
        ...item,
        text: localizedText,
        items: localizedSubItems,
      };
    });
  }
}
