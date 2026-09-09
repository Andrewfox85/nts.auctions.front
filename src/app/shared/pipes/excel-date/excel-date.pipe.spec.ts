import { ExcelDatePipe } from './excel-date.pipe';

describe('ExcelDatePipe', () => {
  let pipe: ExcelDatePipe;

  beforeEach(() => {
    pipe = new ExcelDatePipe();
  });

  it('creates the pipe instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('converts Excel date to Date object with +1 millisecond by default', () => {
    const excelDate = 25569;
    const result = pipe.transform(excelDate);

    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(1970);
    expect(result!.getUTCMonth()).toBe(0);
    expect(result!.getUTCDate()).toBe(1);
    expect(result!.getTime() % 1000).toBe(1);
  });

  it('converts Excel date to Date object without +1 millisecond when skipOffset=true', () => {
    const excelDate = 25569;
    const result = pipe.transform(excelDate, true);

    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(1970);
    expect(result!.getUTCMonth()).toBe(0);
    expect(result!.getUTCDate()).toBe(1);
    expect(result!.getTime() % 1000).toBe(0);
  });

  it('handles fractional Excel dates (time) with +1 millisecond', () => {
    const excelDate = 25569.5;
    const result = pipe.transform(excelDate);

    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(1970);
    expect(result!.getUTCMonth()).toBe(0);
    expect(result!.getUTCDate()).toBe(1);
    expect(result!.getUTCHours()).toBe(12);
  });

  it('handles fractional Excel dates (time) without +1 millisecond when skipOffset=true', () => {
    const excelDate = 25569.5;
    const result = pipe.transform(excelDate, true);

    expect(result).toBeInstanceOf(Date);
    expect(result!.getUTCFullYear()).toBe(1970);
    expect(result!.getUTCMonth()).toBe(0);
    expect(result!.getUTCDate()).toBe(1);
    expect(result!.getUTCHours()).toBe(12);
  });

  it('returns null if the input value is not a number', () => {
    expect(pipe.transform(null as any)).toBeNull();
    expect(pipe.transform(undefined as any)).toBeNull();
    expect(pipe.transform('string' as any)).toBeNull();
  });
});
