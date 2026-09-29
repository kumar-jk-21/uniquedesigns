import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(null);
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const api = { success: (m) => push('success', m), error: (m) => push('error', m), info: (m) => push('info', m) };
  const colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-ink' };
  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${colors[t.type]} text-white rounded-xl px-4 py-3 shadow-lg text-sm animate-fadeUp flex justify-between gap-3`}>
            <span>{t.message}</span>
            <button aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
