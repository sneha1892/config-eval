'use client';

import { useState } from 'react';

type PromptSectionProps = {
  title: string;
  value: string;
  onChange: (next: string) => void;
};

export default function PromptSection({ title, value, onChange }: PromptSectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 shadow-inner">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-t-lg px-4 py-2.5 text-left text-sm font-semibold text-slate-200 hover:bg-slate-900"
        aria-expanded={isOpen}
        aria-controls={`${title.replace(/\s+/g, '-').toLowerCase()}-content`}
      >
        <span>{title}</span>
        <span className="text-base font-bold text-slate-400">{isOpen ? '-' : '+'}</span>
      </button>
      {isOpen && (
        <div
          id={`${title.replace(/\s+/g, '-').toLowerCase()}-content`}
          className="border-t border-slate-800 px-4 pb-3 pt-3"
        >
          <textarea
            className="h-26 w-full resize-none rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}

