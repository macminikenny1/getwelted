'use client';

import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center">
      <div className="bg-welted-bg border border-welted-border rounded-t-2xl md:rounded-2xl w-full md:max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-welted-border shrink-0">
          <button onClick={onClose} className="text-welted-text-muted hover:text-welted-text transition-colors">
            <X size={20} />
          </button>
          <h3 className="text-base font-bold text-welted-text">{title}</h3>
          <div className="w-5">{actions}</div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
