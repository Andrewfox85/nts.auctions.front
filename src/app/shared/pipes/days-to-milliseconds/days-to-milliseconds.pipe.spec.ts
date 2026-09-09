import { DaysToMillisecondsPipe } from './days-to-milliseconds.pipe';

describe('DaysToMillisecondsPipe', () => {
  let pipe: DaysToMillisecondsPipe;

  beforeEach(() => {
    pipe = new DaysToMillisecondsPipe();
  });

  it('should create the pipe instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert days to milliseconds correctly', () => {
    expect(pipe.transform(1)).toBe(86400000);
    expect(pipe.transform(0)).toBe(0);
    expect(pipe.transform(2)).toBe(172800000);
  });

  it('should handle fractional days correctly', () => {
    expect(pipe.transform(0.5)).toBe(43200000);
    expect(pipe.transform(1.25)).toBe(108000000);
  });

  it('should handle negative days correctly', () => {
    expect(pipe.transform(-1)).toBe(-86400000);
  });

  it('should return NaN if input is NaN', () => {
    expect(pipe.transform(NaN)).toBeNaN();
  });
});
