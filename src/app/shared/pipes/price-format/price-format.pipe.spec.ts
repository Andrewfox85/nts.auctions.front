import { PriceFormatPipe } from './price-format.pipe';

describe('PriceFormatPipe', () => {
  const pipe = new PriceFormatPipe();

  it('should format number with two decimals and replace dot with comma', () => {
    expect(pipe.transform(123.456)).toBe('123,46');
    expect(pipe.transform(123.4)).toBe('123,40');
    expect(pipe.transform(0)).toBe('0,00');
    expect(pipe.transform(1.005)).toBe('1,01');
  });

  it('should return empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for NaN', () => {
    expect(pipe.transform(NaN)).toBe('');
  });
});
