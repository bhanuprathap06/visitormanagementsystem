import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // No scroll locking — modal is position:fixed and covers the whole screen.
    // Locking overflow on <main> or <body> causes it to snap back to top.
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${sizes[size]} rounded-2xl animate-slide flex flex-col`}
        style={{
          background: '#fff',
          boxShadow: '0 25px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(226,232,240,0.8)',
          maxHeight: 'calc(100vh - 48px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — always visible */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 rounded-t-2xl"
          style={{
            borderBottom: '1px solid rgba(226,232,240,0.8)',
          }}>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
                       hover:text-slate-700 hover:bg-slate-100 transition-all duration-150
                       text-lg leading-none font-light"
          >×</button>
        </div>

        {/* Body — scrolls independently */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
