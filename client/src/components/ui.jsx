import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const Loader = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3" role="status">
    <div className="h-9 w-9 rounded-full border-2 border-rose/30 border-t-rose animate-spin" />
    <p className="text-sm text-ink/60">{text}</p>
  </div>
);
export const Skeleton = ({ className = 'h-4 w-full' }) => <div className={`animate-pulse rounded-lg bg-sand ${className}`} />;
export const ProductSkeletons = ({ n = 8 }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: n }).map((_, i) => (
      <div key={i} className="space-y-3"><Skeleton className="aspect-[3/4] w-full" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div>
    ))}
  </div>
);
export const RetryButton = ({ onClick, label = 'Try Again' }) => <button onClick={onClick} className="btn-primary">{label}</button>;
export const ErrorMessage = ({ message }) => message ? <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{message}</p> : null;

// Full-area error state. Picks a friendly layout by error category.
export function ErrorState({ error, onRetry }) {
  const net = error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT';
  const down = ['SERVER_DOWN', 'DATABASE_UNAVAILABLE'].includes(error?.code);
  const title = net ? 'Unable to connect' : down ? "We're temporarily offline" : 'Unable to load this page';
  const body = net ? "We couldn't connect to Unique Designs right now. Please check your internet connection and try again." : error?.message || 'Please try again.';
  return (
    <div className="text-center py-16 px-4 animate-fadeUp" role="alert">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-rose-soft text-2xl">{net ? '📡' : '⚠️'}</div>
      <h2 className="text-2xl mb-2">{title}</h2>
      <p className="text-ink/60 max-w-md mx-auto mb-6">{body}</p>
      {onRetry && <RetryButton onClick={onRetry} />}
    </div>
  );
}
export const NetworkError = (p) => <ErrorState error={{ code: 'NETWORK_ERROR' }} {...p} />;
export const ServerError = (p) => <ErrorState error={{ code: 'SERVER_DOWN', message: 'Please try again shortly.' }} {...p} />;
export const ErrorPage = ({ title = 'Page not found', message = "The page you're looking for doesn't exist." }) => (
  <div className="text-center py-24 px-4"><p className="font-display text-7xl text-rose mb-4">404</p><h1 className="text-3xl mb-2">{title}</h1><p className="text-ink/60 mb-6">{message}</p><Link to="/" className="btn-primary">Back to Home</Link></div>
);
export const EmptyState = ({ icon = '✦', title, text, to, cta }) => (
  <div className="text-center py-16 px-4 animate-fadeUp">
    <div className="text-4xl text-rose mb-3">{icon}</div>
    <h2 className="text-2xl mb-2">{title}</h2>
    <p className="text-ink/60 mb-6">{text}</p>
    {to && <Link to={to} className="btn-primary">{cta}</Link>}
  </div>
);

export function ConfirmationModal({ open, title, message, confirmLabel = 'Confirm', danger, busy, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="card p-6 max-w-sm w-full animate-fadeUp">
        <h3 className="text-xl mb-2">{title}</h3>
        <p className="text-sm text-ink/70 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button className="btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={danger ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn-primary'} onClick={onConfirm} disabled={busy}>{busy ? 'Please wait...' : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button className="btn-outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>← Prev</button>
      <span className="text-sm">Page {meta.page} of {meta.totalPages}</span>
      <button className="btn-outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next →</button>
    </div>
  );
}
