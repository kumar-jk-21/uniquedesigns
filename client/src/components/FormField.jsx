import { useState } from 'react';

export function Field({ label, name, required, error, valid, hint, children }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-red-500"> *</span>}</label>
      <div className="relative">{children}
        {valid && !error && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-sm" aria-hidden>✓</span>}
      </div>
      {hint && !error && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
      {error && <p id={`${name}-err`} role="alert" className="text-xs text-red-600 mt-1.5 flex gap-1">⚠ {error}</p>}
    </div>
  );
}
export const cls = (error, valid) => `input ${error ? 'input-error' : valid ? 'input-ok pr-9' : ''}`;

export function PasswordInput({ id, name, value, onChange, onBlur, error, autoComplete, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id || name} name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange} onBlur={onBlur}
        autoComplete={autoComplete} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined}
        className={`input pr-12 ${error ? 'input-error' : ''}`} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-lg min-w-[32px] min-h-[32px]">{show ? '🙈' : '👁'}</button>
    </div>
  );
}
