import { FormControl } from '@angular/forms';
import { httpUrlValidator } from './http-url.validator';

describe('httpUrlValidator', () => {
  it('should accept http and https URLs', () => {
    const validator = httpUrlValidator();

    expect(validator(new FormControl('http://localhost:4201'))).toBeNull();
    expect(validator(new FormControl('https://my.sevdesk.de'))).toBeNull();
  });

  it('should reject non-http URLs', () => {
    const validator = httpUrlValidator();

    expect(validator(new FormControl('ftp://example.test'))).toEqual({
      httpUrl: true,
    });
    expect(validator(new FormControl('not-a-url'))).toEqual({
      httpUrl: true,
    });
  });

  it('should allow empty values when optional', () => {
    const validator = httpUrlValidator({ optional: true });

    expect(validator(new FormControl(''))).toBeNull();
  });
});
