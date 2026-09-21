import type { Card } from '../domain/types';
import { updateEntry, useEntry } from '../store/collection';
import { CardImage } from './CardImage';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Stepper } from './Stepper';

interface Props {
  cards: Card[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
}

/** カード1枚の所持・出・求を編集。前後のカードへ移動できる */
export function CardSheet({ cards, index, onIndexChange }: Props) {
  const card = index !== null ? cards[index] : undefined;
  return (
    <Sheet
      open={!!card}
      onClose={() => onIndexChange(null)}
      title={card ? `${card.cardId} ${card.rarityAbbr}` : ''}
      footer={
        card && (
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => onIndexChange(index! - 1)}
              className="flex items-center gap-1 rounded-full px-3 py-2 font-extrabold hover:bg-pink/15 disabled:opacity-30"
            >
              <Icon name="chevronLeft" className="size-4" />
              前のカード
            </button>
            <span className="tabular-nums opacity-60">
              {index! + 1} / {cards.length}
            </span>
            <button
              type="button"
              disabled={index === cards.length - 1}
              onClick={() => onIndexChange(index! + 1)}
              className="flex items-center gap-1 rounded-full px-3 py-2 font-extrabold hover:bg-pink/15 disabled:opacity-30"
            >
              次のカード
              <Icon name="chevronRight" className="size-4" />
            </button>
          </div>
        )
      }
    >
      {card && <CardEditor key={card.key} card={card} />}
    </Sheet>
  );
}

function CardEditor({ card }: { card: Card }) {
  const e = useEntry(card.key);
  const set = (field: 'own' | 'give' | 'want') => (v: number) =>
    updateEntry(card.key, () => ({ [field]: v }));

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="mx-auto w-40 shrink-0 text-[16px] sm:mx-0">
        <CardImage card={card} className="aspect-[5/7] w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-lg leading-snug font-extrabold">{card.name}</p>
        <p className="mt-1 text-sm opacity-75">
          {[card.category, card.brand, card.idol].filter(Boolean).join('／')}
        </p>
        <div className="mt-4 space-y-3">
          <Stepper label="所持" value={e.own} onChange={set('own')} />
          <Stepper
            label="うち出せる"
            hint="交換に出してよい枚数"
            value={e.give}
            max={e.own}
            onChange={set('give')}
          />
          <Stepper label="求める" hint="交換でほしい枚数" value={e.want} onChange={set('want')} />
        </div>
      </div>
    </div>
  );
}
