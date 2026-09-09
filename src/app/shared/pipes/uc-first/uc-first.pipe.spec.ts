import { UpperCaseFirstLetterPipe } from './uc-first.pipe';

describe('ucFirstPipe', () => {
  let pipe: UpperCaseFirstLetterPipe;

  beforeEach(() => {
    pipe = new UpperCaseFirstLetterPipe();
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should capitalize the first letter of a lowercase word', () => {
    expect(pipe.transform('hello')).toBe('Hello');
  });

  it('should leave the first letter capitalized if already capitalized', () => {
    expect(pipe.transform('World')).toBe('World');
  });

  it('should only capitalize the first letter and leave the rest unchanged', () => {
    expect(pipe.transform('tEST')).toBe('TEST');
  });

  it('should return an empty string if input is an empty string', () => {
    expect(pipe.transform('')).toBe('');
  });

  it('should return the same string if it starts with a non-letter character', () => {
    expect(pipe.transform('123abc')).toBe('123abc');
    expect(pipe.transform('-test')).toBe('-test');
  });

  it('should handle single character strings', () => {
    expect(pipe.transform('a')).toBe('A');
    expect(pipe.transform('Z')).toBe('Z');
  });

  it('should handle whitespace at the beginning of the string', () => {
    expect(pipe.transform(' hello')).toBe(' hello');
  });

  it('should return the same value for null or undefined (runtime)', () => {
    expect(pipe.transform(null)).toBe(null);

    expect(pipe.transform(undefined)).toBe(undefined);
  });
});
