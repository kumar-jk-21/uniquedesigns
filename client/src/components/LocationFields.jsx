import { STATES, districtsOf } from '../utils/validation.js';
import { Field, cls } from './FormField.jsx';

// State → dependent District dropdowns + pincode input. `set(name, value)` updates parent form.
export function StateDropdown({ value, onChange, onBlur, error }) {
  return (
    <Field label="State" name="state" required error={error} valid={!!value}>
      <select id="state" name="state" value={value} onChange={onChange} onBlur={onBlur} className={cls(error)} aria-invalid={!!error}>
        <option value="">Select State</option>
        {STATES.map((s) => <option key={s}>{s}</option>)}
      </select>
    </Field>
  );
}
export function DistrictDropdown({ state, value, onChange, onBlur, error }) {
  return (
    <Field label="District" name="district" required error={error} valid={!!value}>
      <select id="district" name="district" value={value} onChange={onChange} onBlur={onBlur} disabled={!state} className={cls(error) + ' disabled:bg-sand/60'} aria-invalid={!!error}>
        <option value="">{state ? 'Select District' : 'Select State first'}</option>
        {districtsOf(state).map((d) => <option key={d}>{d}</option>)}
      </select>
    </Field>
  );
}
export function PincodeInput({ value, onChange, onBlur, error }) {
  return (
    <Field label="Pincode" name="pincode" required error={error} valid={/^[1-9]\d{5}$/.test(value)}>
      <input id="pincode" name="pincode" inputMode="numeric" maxLength={6} value={value} autoComplete="postal-code"
        onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); onChange(e); }} onBlur={onBlur} className={cls(error, /^[1-9]\d{5}$/.test(value))} placeholder="600001" aria-invalid={!!error} />
    </Field>
  );
}
