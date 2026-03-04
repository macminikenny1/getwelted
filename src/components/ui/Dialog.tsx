'use client';

import { useEffect, useRef } from 'react';

interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'danger' | 'cancel';
}

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  actions: DialogAction[];
}

export default function Dialog({ open, onClose, title, description, actions }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) ref.current?.showModal();
    else ref.current?.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="bg-welted-card border border-welted-border rounded-xl p-6 max-w-sm w-full backdrop:bg-black/60 text-welted-text"
    >
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      {description && <p className="text-welted-text-muted text-sm mb-6">{description}</p>}
      <div className="flex gap-3 justify-end">
        {actions.map((action, i) => {
          const styles = {
            primary: 'bg-welted-accent hover:bg-welted-accent-dim text-welted-bg',
            danger: 'bg-welted-danger hover:bg-welted-danger/80 text-white',
            cancel: 'bg-welted-card border border-welted-border hover:bg-welted-card-hover text-welted-text-muted',
          };
          return (
            <button
              key={i}
              onClick={() => { action.onClick(); onClose(); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${styles[action.variant ?? 'primary']}`}
            >
              {action.label}
            </button>
          );
        })}
      </div>
    </dialog>
  );
}
