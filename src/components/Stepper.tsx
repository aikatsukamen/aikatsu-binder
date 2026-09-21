import { Icon } from './Icon';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
  hint?: string;
  size?: 'md' | 'sm';
}

export function Stepper({ label, value, onChange, max = 999, hint, size = 'md' }: Props) {
  const btn = size === 'md' ? 'size-11 rounded-2xl text-xl' : 'size-7 rounded-lg text-sm';
  return (
    <div className="flex items-center gap-3">
      {size === 'md' && (
        <div className="min-w-0 flex-1">
          <div className="font-extrabold">{label}</div>
          {hint && <div className="text-xs opacity-70">{hint}</div>}
        </div>
      )}
      <div
        className={`flex shrink-0 items-center ${size === 'md' ? 'gap-1.5' : 'gap-1'}`}
        role="group"
        aria-label={label}
      >
        <button
          type="button"
          className={`${btn} grid place-items-center bg-pink/20 text-pink-d disabled:opacity-30`}
          onClick={() => onChange(value - 1)}
          disabled={value <= 0}
          aria-label={`${label}を1減らす`}
        >
          <Icon name="minus" />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          aria-label={label}
          className={`${size === 'md' ? 'w-12 text-xl' : 'w-8 text-base'} [appearance:textfield] bg-transparent text-center font-extrabold outline-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <button
          type="button"
          className={`${btn} grid place-items-center bg-pink text-white disabled:opacity-30`}
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          aria-label={`${label}を1増やす`}
        >
          <Icon name="plus" />
        </button>
      </div>
    </div>
  );
}
