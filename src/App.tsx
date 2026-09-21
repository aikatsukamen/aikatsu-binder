import { useEffect } from 'react';
import { BottomNav, SideNav } from './components/Nav';
import { reloadMaster, useIndex } from './data/master';
import { needsBackup } from './domain/backup';
import { defaultVersionId } from './domain/versions';
import { navigate, useHashRoute } from './hooks/useHashRoute';
import { useTheme } from './hooks/useTheme';
import { useCollection } from './store/collection';
import { rememberVersion, settingsStore, useSettings } from './store/settings';
import { BinderView } from './views/BinderView';
import { ListView } from './views/ListView';
import { SettingsView } from './views/SettingsView';
import { LoadError, Loading } from './views/Status';
import { TradeView } from './views/TradeView';

export default function App() {
  useTheme();
  const route = useHashRoute();
  const index = useIndex();
  const lastExportAt = useSettings((s) => s.lastExportAt);
  const entryCount = Object.keys(useCollection()).length;

  const works = index.status === 'ready' ? index.data.works : [];
  const knownIds = new Set(works.flatMap((w) => w.versions.map((v) => v.versionId)));
  const fallback = (() => {
    const last = settingsStore.get().lastVersion;
    return last && knownIds.has(last) ? last : (defaultVersionId(works) ?? null);
  })();
  const versionId = route.versionId && knownIds.has(route.versionId) ? route.versionId : fallback;
  const needsVersion = route.view === 'binder' || route.view === 'list';

  // URL に弾が無い・知らない弾なら補完
  useEffect(() => {
    if (index.status !== 'ready' || !needsVersion || !versionId) return;
    if (route.versionId !== versionId) navigate({ view: route.view, versionId }, true);
  }, [index.status, needsVersion, route.view, route.versionId, versionId]);

  useEffect(() => {
    if (versionId && needsVersion && index.status === 'ready') rememberVersion(versionId);
  }, [versionId, needsVersion, index.status]);

  const selectVersion = (id: string) => navigate({ view: route.view, versionId: id });

  let body;
  if (index.status === 'loading') body = <Loading />;
  else if (index.status === 'error')
    body = <LoadError error={index.error} onRetry={reloadMaster} />;
  else if (route.view === 'trade') body = <TradeView works={works} />;
  else if (route.view === 'settings') body = <SettingsView />;
  else if (!versionId) body = <Loading />;
  else if (route.view === 'list')
    body = <ListView works={works} versionId={versionId} onSelectVersion={selectVersion} />;
  else
    body = (
      <BinderView
        works={works}
        versionId={versionId}
        page={route.page}
        onSelectVersion={selectVersion}
      />
    );

  const navProps = {
    current: route.view,
    versionId,
    settingsAlert: needsBackup(lastExportAt, entryCount),
  };

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <SideNav {...navProps} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{body}</div>
      <BottomNav {...navProps} />
    </div>
  );
}
