import { passwordRules, passwordScore } from '../utils/validation.js';

export default function PasswordStrength({ password }) {
  const score = passwordScore(password);
  const level = !password ? -1 : score <= 2 ? 0 : score === 3 ? 1 : score === 4 ? 2 : 3;
  const labels = ['Too Weak', 'Weak', 'Medium', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-500', 'bg-emerald-500'];
  return (
    <div className="mt-3 space-y-2" aria-live="polite">
      <div className="flex gap-1.5">{labels.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= level ? colors[level] : 'bg-sand'}`} />)}</div>
      <p className="text-xs">Password Strength: <b>{level >= 0 ? labels[level] : '—'}</b></p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {passwordRules.map((r) => { const okk = r.test(password); return <li key={r.key} className={okk ? 'text-emerald-600' : 'text-ink/50'}>{okk ? '✓' : '○'} {r.label}</li>; })}
      </ul>
    </div>
  );
}
