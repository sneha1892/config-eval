'use client';

type EvaluationRatingProps = {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (next: string) => void;
};

export default function EvaluationRating({ label, name, options, value, onChange }: EvaluationRatingProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 p-3.5">
      <label className="text-sm font-semibold text-slate-200">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = option.value === value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-center justify-center rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${isActive ? 'border-slate-200 bg-slate-800 text-white' : 'border-slate-700 bg-slate-950/60 text-slate-300 hover:border-slate-500 hover:text-slate-100'}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isActive}
                onChange={(event) => onChange(event.target.value)}
                className="sr-only"
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
