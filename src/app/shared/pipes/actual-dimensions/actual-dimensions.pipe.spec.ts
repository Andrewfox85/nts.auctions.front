import { ActualDimensionsPipe } from './actual-dimensions.pipe';

describe('ActualDimensionsPipe', () => {
  let pipe: ActualDimensionsPipe;

  beforeEach(() => {
    pipe = new ActualDimensionsPipe();
  });

  it('should create an instance of the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert number input to string and return first part by default', () => {
    expect(pipe.transform(123456)).toBe('123456');
    expect(pipe.transform(123456, 0)).toBe('123456');
  });

  it('should split string input by "#" and return the correct part', () => {
    expect(pipe.transform('123#456#789')).toBe('123');
    expect(pipe.transform('123#456#789', 1)).toBe('456');
    expect(pipe.transform('123#456#789', 2)).toBe('789');
  });

  it('should return null if input is null or undefined', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });

  it('should return null if the part index is out of range', () => {
    expect(pipe.transform('abc#def', 5)).toBeNull();
    expect(pipe.transform('abc#def', -1)).toBeNull();
  });

  it('should handle input without any delimiter', () => {
    expect(pipe.transform('singleValue')).toBe('singleValue');
    expect(pipe.transform('singleValue', 0)).toBe('singleValue');
    expect(pipe.transform('singleValue', 1)).toBeNull();
  });

  it('should handle empty string input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform('', 1)).toBeNull();
  });
});
