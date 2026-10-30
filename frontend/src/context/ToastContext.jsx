import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const success = (msg, dur) => showToast(msg, 'success', dur);
  const error = (msg, dur) => showToast(msg, 'error', dur);
  const warning = (msg, dur) => showToast(msg, 'warning', dur);

  return (
    <ToastContext.Provider value={{ success, error, warning }}>
      {children}
      <div className="toast-container-custom no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-custom ${t.type} shadow-lg border-start border-4`}>
            <div style={{ fontSize: '1.1rem' }}>
              {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚠️'}
            </div>
            <div className="small fw-semibold">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
