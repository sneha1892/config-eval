'use client';

import { useEffect, useRef } from 'react';

type PromptSectionProps = {
  title: string;
  value: string;
  onChange: (next: string) => void;
};

export default function PromptSection({ title, value, onChange }: PromptSectionProps) {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
      <textarea
        ref={textAreaRef}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none overflow-hidden rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm leading-relaxed text-slate-200 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
        placeholder="Enter prompt text..."
      />
    </div>
  );
}

