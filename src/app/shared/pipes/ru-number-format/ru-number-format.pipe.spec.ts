import { RuNumberFormatPipe } from './ru-number-format.pipe';

describe('RuNumberFormatPipe', () => {
  let pipe: RuNumberFormatPipe;

  beforeEach(() => {
    pipe = new RuNumberFormatPipe();
  });

  it('should return an empty string if value is null, undefined, or NaN', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform(NaN)).toBe('');
  });

  it('should format number without options', () => {
    const num = 1234567.89;
    expect(pipe.transform(num)).toBe(num.toLocaleString('ru'));
  });

  it('should format with minimum fraction digits', () => {
    const num = 1234.5;
    const minFractionDigits = 3;
    expect(pipe.transform(num, minFractionDigits)).toBe(
      num.toLocaleString('ru', { minimumFractionDigits: minFractionDigits })
    );
  });

  it('should format with maximum fraction digits', () => {
    const num = 1234.56789;
    const maxFractionDigits = 2;
    expect(pipe.transform(num, undefined, maxFractionDigits)).toBe(
      num.toLocaleString('ru', { maximumFractionDigits: maxFractionDigits })
    );
  });

  it('should format with minimum and maximum fraction digits', () => {
    const num = 1234.56789;
    const minFractionDigits = 2;
    const maxFractionDigits = 4;
    expect(pipe.transform(num, minFractionDigits, maxFractionDigits)).toBe(
      num.toLocaleString('ru', { minimumFractionDigits: minFractionDigits, maximumFractionDigits: maxFractionDigits })
    );
  });

  it('should work for good.goodsSpecifications case with minimum fraction digits', () => {
    const value = 56;
    const fieldPrecision = 3;
    expect(pipe.transform(value, fieldPrecision)).toBe(
      value.toLocaleString('ru', { minimumFractionDigits: fieldPrecision })
    );
  });

  it('should work for totalRowData case with maximum fraction digits', () => {
    const value = 1234.5678;
    const precisionVolume = 1;
    expect(pipe.transform(value, undefined, precisionVolume)).toBe(
      value.toLocaleString('ru', { maximumFractionDigits: precisionVolume })
    );
  });

  it('should work for idDemandOfferGood case with minimum and maximum fraction digits equal to currencyPrecision', () => {
    const value = 9876.54321;
    const currencyPrecision = 2;
    expect(pipe.transform(value, currencyPrecision, currencyPrecision)).toBe(
      value.toLocaleString('ru', { minimumFractionDigits: currencyPrecision, maximumFractionDigits: currencyPrecision })
    );
  });

  it('should work for lotSummaryVolume case without parameters', () => {
    const value = 12345.6789;
    expect(pipe.transform(value)).toBe(value.toLocaleString('ru'));
  });
});
