import { useMemo, useState } from 'react';
import type { VersionMeta, WorkMeta } from '../domain/types';
import { shortWork } from '../domain/versions';
import { useSettings } from '../store/settings';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  onClose: () => void;
  works: WorkMeta[];
  current: string | null;
  onSelect: (versionId: string) => void;
}

export function VersionPicker({ open, onClose, works, current, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const recent = useSettings((s) => s.recentVersions);
  const all = useMemo(() => works.flatMap((w) => w.versions), [works]);
  const byId = useMemo(() => new Map(all.map((v) => [v.versionId, v])), [all]);
  const currentWork = current ? byId.get(current)?.work : undefined;

  const q = query.trim();
  const hits = q
    ? all.filter((v) => `${v.work} ${shortWork(v.work)} ${v.title}`.includes(q))
    : null;

  const pick = (id: string) => {
    onSelect(id);
    setQuery('');
    onClose();
  };

  const row = (v: VersionMeta, withWork = false) => (
    <li key={v.versionId}>
      <button
        type="button"
        onClick={() => pick(v.versionId)}
        aria-current={v.versionId === current ? 'true' : undefined}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-pink/15 aria-[current]:bg-pink aria-[current]:text-white"
      >
        <span className="min-w-0 flex-1 truncate">
          {withWork && <span className="mr-1.5 text-xs opacity-75">{shortWork(v.work)}</span>}
          {v.title}
        </span>
        {!v.isRegular && (
          <span className="rounded-md bg-pink/20 px-1.5 text-xs text-pink-d">特別</span>
        )}
        <span className="text-xs tabular-nums opacity-70">{v.count}枚</span>
      </button>
    </li>
  );

  return (
    <Sheet open={open} onClose={onClose} title="弾を選ぶ">
      <label className="mb-4 flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-page-ink">
        <Icon name="search" className="size-4 opacity-60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="2014シリーズ、スターズ 4弾…"
          className="min-w-0 flex-1 bg-transparent outline-none"
          aria-label="弾を検索"
        />
      </label>

      {hits ? (
        <ul className="space-y-0.5">
          {hits.length ? (
            hits.map((v) => row(v, true))
          ) : (
            <li className="px-3 py-6 text-center opacity-70">一致する弾がありません</li>
          )}
        </ul>
      ) : (
        <>
          {recent.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-1 px-1 text-sm opacity-75">最近開いた弾</h3>
              <ul className="space-y-0.5">
                {recent.flatMap((id) => {
                  const v = byId.get(id);
                  return v ? [row(v, true)] : [];
                })}
              </ul>
            </section>
          )}
          <div className="space-y-2">
            {works.map((w) => (
              <details
                key={w.work}
                open={w.work === currentWork}
                className="group rounded-2xl bg-white/50 dark:bg-white/5"
              >
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 font-extrabold [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{w.work}</span>
                  <span className="text-xs font-medium opacity-70">{w.versions.length}弾</span>
                  <Icon
                    name="chevronDown"
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                <ul className="space-y-0.5 px-1 pb-2">{w.versions.map((v) => row(v))}</ul>
              </details>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}
