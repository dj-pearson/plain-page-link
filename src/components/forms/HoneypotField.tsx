import { forwardRef } from 'react';

/**
 * A field people never see or fill; bots that fill every input do (US-220).
 * Off-screen rather than display:none, which some bots skip. Hidden from
 * assistive technology and the tab order, and named so autofill leaves it be.
 */
export const HoneypotField = forwardRef<HTMLInputElement>((_props, ref) => (
  <div aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
    <label>
      Leave this field empty
      <input ref={ref} type="text" name="company_website" tabIndex={-1} autoComplete="off" defaultValue="" />
    </label>
  </div>
));
HoneypotField.displayName = 'HoneypotField';
