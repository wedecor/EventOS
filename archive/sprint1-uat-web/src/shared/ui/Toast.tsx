import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type ToastMessage = {
  id: number;
  text: string;
  tone: 'success' | 'error';
};

type ToastContextValue = {
  push: (text: string, tone?: 'success' | 'error') => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMessage[]>([]);

  const push = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={[
              'rounded-md px-4 py-2 text-sm text-white shadow-lg',
              item.tone === 'error' ? 'bg-red-700' : 'bg-slate-800',
            ].join(' ')}
          >
            {item.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
