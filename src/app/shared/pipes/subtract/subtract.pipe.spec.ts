import { SubtractPipe } from './subtract.pipe';

describe('SubtractPipe', () => {
  let pipe: SubtractPipe;

  beforeEach(() => {
    pipe = new SubtractPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should subtract two positive numbers correctly', () => {
    expect(pipe.transform(10, 4)).toBe(6);
  });

  it('should subtract a larger number from a smaller number and return a negative result', () => {
    expect(pipe.transform(4, 10)).toBe(-6);
  });

  it('should subtract zero correctly', () => {
    expect(pipe.transform(5, 0)).toBe(5);
    expect(pipe.transform(0, 5)).toBe(-5);
  });

  it('should handle negative numbers correctly', () => {
    expect(pipe.transform(-5, -3)).toBe(-2);
    expect(pipe.transform(-3, 5)).toBe(-8);
  });
});
