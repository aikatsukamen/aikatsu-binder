import { useState } from 'react';
import type { Card } from '../domain/types';

/** 画像が無い・読めないときはカード名のプレースホルダ */
export function CardImage({
  card,
  className = '',
  eager = false,
}: {
  card: Card;
  className?: string;
  /** バインダーはめくり中に遅延読み込みされると見栄えが悪いので即時読み込み */
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!card.image || failed) {
    return (
      <div
        className={`grid place-items-center rounded-[0.4em] border-[0.15em] border-white bg-pink/25 p-[0.4em] text-center text-[0.7em] leading-tight text-page-ink ${className}`}
      >
        {card.name}
      </div>
    );
  }
  return (
    <img
      src={card.image}
      alt={card.name}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={`object-contain drop-shadow-[0_0.1em_0.2em_rgba(120,40,80,0.3)] ${className}`}
    />
  );
}
