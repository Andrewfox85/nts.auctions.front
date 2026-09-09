export function matchesFinanceSourceFilter(
  isGovernmentPurchase: boolean | number,
  ownFunds: boolean,
  publicProcurement: boolean,
): boolean {
  if (ownFunds && publicProcurement) {
    return isGovernmentPurchase != null;
  }

  if (ownFunds) {
    return !isGovernmentPurchase;
  }

  if (publicProcurement) {
    return Boolean(isGovernmentPurchase);
  }

  return true;
}
