import { ToNumberPipe } from './to-number.pipe';

describe('ToNumberPipe', () => {
  let pipe: ToNumberPipe;

  beforeEach(() => {
    pipe = new ToNumberPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert string number to number', () => {
    expect(pipe.transform('123')).toBe(123);
  });

  it('should convert string float to number', () => {
    expect(pipe.transform('123.45')).toBeCloseTo(123.45);
  });

  it('should convert boolean true to 1', () => {
    expect(pipe.transform(true)).toBe(1);
  });

  it('should convert boolean false to 0', () => {
    expect(pipe.transform(false)).toBe(0);
  });

  it('should convert null to 0', () => {
    expect(pipe.transform(null)).toBe(0);
  });

  it('should convert undefined to NaN', () => {
    expect(pipe.transform(undefined)).toEqual(NaN);
  });

  it('should convert non-numeric string to NaN', () => {
    expect(pipe.transform('abc')).toEqual(NaN);
  });

  it('should pass through numbers unchanged', () => {
    expect(pipe.transform(789)).toBe(789);
  });
});
