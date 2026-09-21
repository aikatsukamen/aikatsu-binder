import { Icon } from '../components/Icon';

export function Loading({ label = '読み込み中…' }: { label?: string }) {
  return (
    <div className="grid flex-1 place-items-center p-8 opacity-70" role="status">
      {label}
    </div>
  );
}

export function LoadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center" role="alert">
      <div>
        <p className="font-extrabold">カード情報を読み込めませんでした</p>
        <p className="mt-1 text-sm opacity-75">{error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-pink px-5 py-2.5 font-extrabold text-white"
        >
          <Icon name="refresh" className="size-4" />
          再読み込み
        </button>
      </div>
    </div>
  );
}

export function EmptyFilter() {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center opacity-80">
      条件に合うカードがありません。上のチップをタップすると条件を外せます。
    </div>
  );
}
