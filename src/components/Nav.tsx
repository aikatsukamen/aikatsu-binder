import { navigate, type View } from '../hooks/useHashRoute';
import { Icon, type IconName } from './Icon';

const ITEMS: { view: View; label: string; icon: IconName }[] = [
  { view: 'binder', label: 'バインダー', icon: 'book' },
  { view: 'list', label: '一覧', icon: 'list' },
  { view: 'trade', label: '交換', icon: 'exchange' },
  { view: 'settings', label: '設定', icon: 'settings' },
];

interface Props {
  current: View;
  versionId: string | null;
  settingsAlert: boolean;
}

export function BottomNav({ current, versionId, settingsAlert }: Props) {
  return (
    <nav
      className="flex border-t-2 border-pink/40 bg-cream/90 pb-[env(safe-area-inset-bottom)] text-page-ink backdrop-blur md:hidden"
      aria-label="画面切り替え"
    >
      {ITEMS.map((it) => (
        <NavButton key={it.view} {...it} {...{ current, versionId, settingsAlert }} compact />
      ))}
    </nav>
  );
}

export function SideNav({ current, versionId, settingsAlert }: Props) {
  return (
    <nav
      className="hidden w-52 shrink-0 flex-col gap-1 bg-cream/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-page-ink md:flex"
      aria-label="画面切り替え"
    >
      <div className="outline-title mb-4 px-2 text-xl">カードバインダー</div>
      {ITEMS.map((it) => (
        <NavButton key={it.view} {...it} {...{ current, versionId, settingsAlert }} />
      ))}
    </nav>
  );
}

function NavButton({
  view,
  label,
  icon,
  current,
  versionId,
  settingsAlert,
  compact,
}: Props & (typeof ITEMS)[number] & { compact?: boolean }) {
  const active = view === current;
  return (
    <button
      type="button"
      onClick={() => navigate({ view, versionId })}
      aria-current={active ? 'page' : undefined}
      className={
        compact
          ? 'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] opacity-60 aria-[current]:font-extrabold aria-[current]:text-pink-d aria-[current]:opacity-100'
          : 'relative flex items-center gap-3 rounded-2xl px-3 py-2.5 aria-[current]:bg-pink aria-[current]:font-extrabold aria-[current]:text-white'
      }
    >
      <Icon name={icon} className={compact ? 'size-6' : 'size-5'} />
      {label}
      {view === 'settings' && settingsAlert && (
        <span
          className={`absolute size-2 rounded-full bg-want ${compact ? 'top-1.5 right-[calc(50%-16px)]' : 'right-3'}`}
          aria-label="バックアップ推奨"
        />
      )}
    </button>
  );
}
