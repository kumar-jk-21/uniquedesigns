import { useCallback, useEffect, useState } from 'react';

// Runs an async fn on mount / dep change. Returns { data, meta, loading, error, reload }.
export default function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, meta: null, loading: true, error: null });
  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn().then((r) => alive && setState({ data: r.data, meta: r.meta || null, loading: false, error: null }))
        .catch((e) => alive && setState({ data: null, meta: null, loading: false, error: e }));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => run(), [run]);
  return { ...state, reload: run };
}
export const useDebounce = (value, ms = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
};
