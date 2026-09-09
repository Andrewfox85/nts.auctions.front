/**
 * Глобальные CSS-стили body layout для торгов v2.
 * Временное решение для корректного отображения legacy-страниц v1; убрать после полного рефакторинга.
 */

/** Id тега `<style>`, инжектируемого в document.head. */
export const TRADING_V2_BODY_LAYOUT_STYLE_ID: string = 'trading-v2-body-layout';

/** CSS-правила прокрутки и высоты для body.trading-v2-active и вложенных компонентов. */
export const TRADING_V2_BODY_LAYOUT_CSS: string = `
/* Page scroll on body; footer stays in default app layout (sibling of main). */
body.trading-v2-active {
  height: auto !important;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

body.trading-v2-active app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: auto !important;
  overflow: visible;
}

body.trading-v2-active main {
  flex: 1 0 auto !important;
  min-height: 0 !important;
  overflow: visible !important;
  overflow-y: visible !important;
  display: flex;
  flex-direction: column;
}

body.trading-v2-active main > router-outlet + * {
  flex: 0 1 auto;
  min-height: min-content;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

body.trading-v2-active app-english-upgrading-auction,
body.trading-v2-active app-dutch-down-auction,
body.trading-v2-active app-double-counter-auction {
  display: block;
  flex: none;
  height: auto !important;
  min-height: 0;
  overflow: visible !important;
}

body.trading-v2-active app-trading-shell {
  display: block;
  height: auto;
  min-height: min-content;
  overflow: visible;
}

body.trading-v2-active app-trading-shell main.offers,
body.trading-v2-active app-trading-shell main.auctions,
body.trading-v2-active app-trading-shell main.traders,
body.trading-v2-active app-trading-shell main.registrations,
body.trading-v2-active app-trading-shell main.deals,
body.trading-v2-active app-trading-shell main.deposit,
body.trading-v2-active app-trading-shell main.messages,
body.trading-v2-active app-trading-shell main.setting,
body.trading-v2-active app-trading-shell main.offers .main_component,
body.trading-v2-active app-trading-shell main.offers .content,
body.trading-v2-active app-trading-shell main.offers .tabs,
body.trading-v2-active app-trading-shell main.offers .body,
body.trading-v2-active app-trading-shell main.offers .body_content,
body.trading-v2-active app-trading-shell main.offers .offers-body-wrapper,
body.trading-v2-active app-trading-shell main.auctions .main_component,
body.trading-v2-active app-trading-shell main.auctions .content,
body.trading-v2-active app-trading-shell main.auctions .tabs,
body.trading-v2-active app-trading-shell main.auctions .body,
body.trading-v2-active app-trading-shell main.auctions .body_content,
body.trading-v2-active app-trading-shell main.auctions .offers-body-wrapper,
body.trading-v2-active app-trading-shell main.traders .main_component,
body.trading-v2-active app-trading-shell main.traders .content,
body.trading-v2-active app-trading-shell main.traders .body,
body.trading-v2-active app-trading-shell main.traders .traders-body-wrapper,
body.trading-v2-active app-trading-shell main.registrations .main_component,
body.trading-v2-active app-trading-shell main.registrations .content,
body.trading-v2-active app-trading-shell main.registrations .body,
body.trading-v2-active app-trading-shell main.registrations .registrations-body-wrapper,
body.trading-v2-active app-trading-shell dx-tab-panel,
body.trading-v2-active app-trading-shell .dx-tabpanel-container,
body.trading-v2-active app-trading-shell .dx-multiview-wrapper,
body.trading-v2-active app-trading-shell .dx-multiview-item,
body.trading-v2-active app-trading-shell .dx-multiview-item-content {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}

body.trading-v2-active app-trading-shell app-filters :is(aside, form) {
  height: auto !important;
  max-height: none !important;
}

body.trading-v2-active app-trading-shell .dx-datagrid,
body.trading-v2-active app-trading-shell .dx-datagrid-rowsview,
body.trading-v2-active app-trading-shell .dx-datagrid-rowsview .dx-scrollable-wrapper,
body.trading-v2-active app-trading-shell .dx-datagrid-rowsview .dx-scrollable-container,
body.trading-v2-active app-trading-shell .dx-datagrid-rowsview .dx-scrollable-content {
  height: auto !important;
  max-height: none !important;
}

body.trading-v2-active app-trading-shell .dx-datagrid-rowsview .dx-scrollable-scroll,
body.trading-v2-active app-trading-shell .dx-datagrid-rowsview .dx-scrollbar-vertical {
  display: none !important;
}
`;
