import { ToOADatePipe } from './to-oa-date.pipe';

describe('ToOADatePipe', () => {
  let pipe: ToOADatePipe;

  beforeEach(() => {
    pipe = new ToOADatePipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return null if input value is null or undefined', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should correctly convert a Date object to OADate string with default fraction digits', () => {
    const date = new Date('2025-09-01T00:00:00Z');
    const result = pipe.transform(date);

    expect(typeof result).toBe('string');
    expect(Number(result)).toBeGreaterThan(40000);
  });

  it('should correctly convert a timestamp (number) to OADate string with default fraction digits', () => {
    const timestamp = new Date('2025-09-01T00:00:00Z').getTime();
    const result = pipe.transform(timestamp);
    expect(typeof result).toBe('string');
    expect(Number(result)).toBeGreaterThan(40000);
  });

  it('should round the OADate result to the specified number of decimal places', () => {
    const date = new Date('2025-09-01T12:34:56Z');
    const resultZeroDigits = pipe.transform(date, 0);
    const resultTwoDigits = pipe.transform(date, 2);

    expect(resultZeroDigits).toMatch(/^\d+$/);
    expect(resultTwoDigits).toMatch(/^\d+\.\d{2}$/);

    expect(Number(resultZeroDigits)).toBeCloseTo(Number(resultTwoDigits), 0);
  });

  it('should handle dates before 1899-12-30 correctly', () => {
    const oldDate = new Date('1800-01-01T00:00:00Z');
    const result = pipe.transform(oldDate);
    expect(typeof result).toBe('string');
    expect(Number(result)).toBeLessThan(0);
  });
});
