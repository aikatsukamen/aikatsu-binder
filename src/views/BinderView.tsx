import { useCallback, useEffect, useMemo, useState } from 'react';
import { Binder } from '../components/Binder';
import { CardSheet } from '../components/CardSheet';
import { Icon } from '../components/Icon';
import { Pocket } from '../components/Pocket';
import { reloadMaster } from '../data/master';
import type { Card, WorkMeta } from '../domain/types';
import { navigate } from '../hooks/useHashRoute';
import { updateEntry } from '../store/collection';
import { patchSettings, useSettings } from '../store/settings';
import { EmptyFilter, LoadError, Loading } from './Status';
import { useVersionView } from './useVersionView';
import { VersionHeader } from './VersionHeader';

interface Props {
  works: WorkMeta[];
  versionId: string;
  page: number;
  onSelectVersion: (id: string) => void;
}

export function BinderView({ works, versionId, page, onSelectVersion }: Props) {
  const v = useVersionView(versionId);
  const perPage = useSettings((s) => s.perPage);
  const registerMode = useSettings((s) => s.registerMode);
  const [editing, setEditing] = useState<number | null>(null);
  const cols = perPage === 9 ? 3 : 2;

  const pageCount = Math.max(1, Math.ceil(v.visible.length / perPage));
  const meta = works.flatMap((w) => w.versions).find((x) => x.versionId === versionId);

  const onPageChange = useCallback(
    (p: number) => navigate({ view: 'binder', versionId, page: p }, true),
    [versionId],
  );

  // 前後の見開きの画像を先読みして、めくったときに白くならないようにする
  useEffect(() => {
    const from = Math.max(0, (page - 2) * perPage);
    const to = (page + 4) * perPage;
    for (const c of v.visible.slice(from, to)) {
      if (c.image) new Image().src = c.image;
    }
  }, [page, perPage, v.visible]);

  const indexOf = useMemo(() => new Map(v.visible.map((c, i) => [c.key, i])), [v.visible]);

  const onTap = (card: Card) => {
    if (registerMode) updateEntry(card.key, (e) => ({ own: e.own + 1 }));
    else setEditing(indexOf.get(card.key) ?? null);
  };
  const onLongPress = (card: Card) => {
    if (registerMode) updateEntry(card.key, (e) => ({ own: e.own - 1 }));
    else setEditing(indexOf.get(card.key) ?? null);
  };

  const renderPockets = (pageIndex: number) =>
    Array.from({ length: perPage }, (_, k) => {
      const card = v.visible[pageIndex * perPage + k];
      return card ? (
        <Pocket key={card.key} card={card} onTap={onTap} onLongPress={onLongPress} />
      ) : null;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <VersionHeader
        works={works}
        versionId={versionId}
        onSelectVersion={onSelectVersion}
        total={v.cards.length}
        owned={v.ownedCount}
        visible={v.visible.length}
        filter={v.filter}
        categories={v.categories}
        rarities={v.rarities}
        extra={
          <button
            type="button"
            onClick={() => patchSettings({ registerMode: !registerMode })}
            aria-pressed={registerMode}
            className="mb-1 flex shrink-0 items-center gap-1 rounded-full border-2 border-pink bg-cream px-3 py-1.5 text-sm font-extrabold text-pink-d aria-pressed:bg-pink-d aria-pressed:text-white"
          >
            <Icon name="tapPlus" className="size-4" />
            所持管理
          </button>
        }
      />
      {registerMode && (
        <p className="mx-3 rounded-xl bg-pink-d px-3 py-1.5 text-center text-sm text-white md:mx-5">
          タップで所持 +1、長押しで −1
        </p>
      )}
      <main className="flex min-h-0 flex-1 flex-col px-2 pt-2 md:px-5">
        {v.res.status === 'loading' && <Loading />}
        {v.res.status === 'error' && <LoadError error={v.res.error} onRetry={reloadMaster} />}
        {v.res.status === 'ready' &&
          (v.visible.length === 0 ? (
            <EmptyFilter />
          ) : (
            <Binder
              pageCount={pageCount}
              page={page}
              onPageChange={onPageChange}
              cols={cols}
              rows={cols}
              renderPockets={renderPockets}
              coverLabel={
                <span>
                  <span className="block text-[0.6em] opacity-90">{meta?.work}</span>
                  {meta?.title}
                </span>
              }
            />
          ))}
      </main>
      <CardSheet cards={v.visible} index={editing} onIndexChange={setEditing} />
    </div>
  );
}
