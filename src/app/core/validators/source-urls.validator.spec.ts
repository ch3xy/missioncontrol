import { FormControl } from '@angular/forms';
import { sourceUrlsValidator } from './source-urls.validator';

describe('sourceUrlsValidator', () => {
  const validator = sourceUrlsValidator();

  it('should accept empty values', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('\n  \n'))).toBeNull();
  });

  it('should accept http(s) URLs and paths on this host, one per line', () => {
    expect(
      validator(
        new FormControl(
          'https://example.test/calendar.ics\n\n/missioncontrol/calendars/work.ics\n',
        ),
      ),
    ).toBeNull();
  });

  it('should reject a list with any invalid line', () => {
    expect(validator(new FormControl('/calendars/a.ics\ncalendars/b.ics'))).toEqual({
      sourceUrls: true,
    });
    expect(validator(new FormControl('//example.test/a.ics'))).toEqual({ sourceUrls: true });
    expect(validator(new FormControl('webcal://example.test/a.ics'))).toEqual({
      sourceUrls: true,
    });
  });
});
