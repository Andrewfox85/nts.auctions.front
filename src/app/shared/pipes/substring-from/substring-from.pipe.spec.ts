import { SubstringFromPipe } from './substring-from.pipe';

describe('SubstringFromPipe', () => {
  let pipe: SubstringFromPipe;

  beforeEach(() => {
    pipe = new SubstringFromPipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string if input is null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return the whole string if startIndex is 0 or not provided', () => {
    expect(pipe.transform('hello')).toBe('hello');
    expect(pipe.transform('hello', 0)).toBe('hello');
  });

  it('should return substring starting from the given startIndex', () => {
    expect(pipe.transform('hello', 1)).toBe('ello');
    expect(pipe.transform('hello', 2)).toBe('llo');
    expect(pipe.transform('hello', 5)).toBe('');
  });

  it('should handle startIndex greater than string length', () => {
    expect(pipe.transform('test', 10)).toBe('');
  });

  it('should handle empty string input', () => {
    expect(pipe.transform('')).toBe('');
  });
});
