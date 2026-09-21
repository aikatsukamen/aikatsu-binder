import { useRef } from 'react';
import type { Card } from '../domain/types';
import { useEntry } from '../store/collection';
import { CardImage } from './CardImage';

interface Props {
  card: Card;
  onTap: (card: Card) => void;
  onLongPress?: (card: Card) => void;
}

const LONG_PRESS_MS = 500;

export function Pocket({ card, onTap, onLongPress }: Props) {
  const entry = useEntry(card.key);
  const timer = useRef<number | undefined>(undefined);
  const start = useRef<{ x: number; y: number } | null>(null);
  const longFired = useRef(false);

  const clear = () => {
    window.clearTimeout(timer.current);
    start.current = null;
  };

  const label = [
    `${card.cardId} ${card.name}`,
    entry.own ? `${entry.own}枚所持` : '未所持',
    entry.give ? `出${entry.give}` : '',
    entry.want ? `求${entry.want}` : '',
  ]
    .filter(Boolean)
    .join('、');

  return (
    <>
      <div className="relative z-[1] w-full truncate text-center text-[1.05em] leading-[1.5] font-extrabold text-pink">
        {card.cardId} {card.rarityAbbr}
      </div>
      <button
        type="button"
        className={`pocket-card ${entry.own ? '' : 'is-missing'}`}
        aria-label={label}
        onPointerDown={(e) => {
          if (!onLongPress) return;
          longFired.current = false;
          start.current = { x: e.clientX, y: e.clientY };
          timer.current = window.setTimeout(() => {
            longFired.current = true;
            navigator.vibrate?.(15);
            onLongPress(card);
          }, LONG_PRESS_MS);
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) clear();
        }}
        onPointerUp={clear}
        onPointerCancel={clear}
        onPointerLeave={clear}
        onContextMenu={(e) => onLongPress && e.preventDefault()}
        onClick={() => {
          if (longFired.current) {
            longFired.current = false;
            return;
          }
          onTap(card);
        }}
      >
        {/* 未所持の薄表示は画像だけにかけ、バッジは薄くしない */}
        <span className="pocket-art absolute inset-0">
          <CardImage card={card} className="size-full" eager />
        </span>
        {entry.own > 0 && (
          <span className="absolute top-[0.2em] right-[0.2em] z-[2] rounded-full border-[0.12em] border-white bg-pink px-[0.45em] text-[0.95em] leading-[1.35] font-extrabold text-white shadow">
            ×{entry.own}
          </span>
        )}
        <span className="absolute right-[0.25em] bottom-[18%] z-[2] flex flex-col items-end gap-[0.15em] text-[1.35em]">
          {entry.want > 0 && <span className="glow-badge is-want">求{entry.want}</span>}
          {entry.give > 0 && <span className="glow-badge is-give">出{entry.give}</span>}
        </span>
      </button>
    </>
  );
}
