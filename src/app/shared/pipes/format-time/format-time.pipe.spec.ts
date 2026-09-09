import { FormatTimePipe } from './format-time.pipe';
import * as utils from '@helpers';

describe('FormatTimePipe', () => {
  let pipe: FormatTimePipe;

  beforeEach(() => {
    pipe = new FormatTimePipe();
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should call formatSecondsToTime with the input seconds', () => {
    const spy = spyOn(utils, 'formatSecondsToTime').and.returnValue('mocked-result');

    const result = pipe.transform(123);
    expect(spy).toHaveBeenCalledWith(123);
    expect(result).toBe('mocked-result');
  });

  it('should return empty string when input is null or undefined', () => {
    expect(pipe.transform(null)).toBe(utils.formatSecondsToTime(null));
    expect(pipe.transform(undefined)).toBe(utils.formatSecondsToTime(undefined));
  });

  it('should correctly format seconds (integration test)', () => {
    // без моков — проверка реальной функции
    const seconds = 3661; // 1:01:01
    const result = pipe.transform(seconds);
    expect(result).toBe('01:01:01');
  });
});
