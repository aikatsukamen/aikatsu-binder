import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** スマホは下から出るシート、PC は中央ダイアログ */
export function Sheet({ open, onClose, title, children, footer }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-panel pb-[env(safe-area-inset-bottom)] shadow-xl outline-none md:max-w-lg md:rounded-3xl md:pb-0"
      >
        <div className="flex items-center gap-2 border-b-2 border-dashed border-dash/60 px-5 py-3">
          <h2 id={titleId} className="min-w-0 flex-1 truncate text-lg font-extrabold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 rounded-full p-2 hover:bg-pink/15"
            aria-label="閉じる"
          >
            <Icon name="x" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="border-t-2 border-dashed border-dash/60 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
