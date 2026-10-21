import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isSourceUrl, splitSourceUrls } from '../services/source-urls';

/** Optional; every non-empty line must be an http(s) URL or a path on this host. */
export function sourceUrlsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null =>
    splitSourceUrls(String(control.value ?? '')).every(isSourceUrl) ? null : { sourceUrls: true };
}
