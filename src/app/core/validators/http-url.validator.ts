import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

interface HttpUrlValidatorOptions {
  optional?: boolean;
}

export function httpUrlValidator(options: HttpUrlValidatorOptions = {}): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    if (!value) {
      return options.optional ? null : { httpUrl: true };
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:' ? null : { httpUrl: true };
    } catch {
      return { httpUrl: true };
    }
  };
}
