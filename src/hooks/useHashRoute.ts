import { useSyncExternalStore } from 'react';

export type View = 'binder' | 'list' | 'trade' | 'settings';

export interface Route {
  view: View;
  versionId: string | null;
  /** 0 始まりのページ番号 */
  page: number;
}

const VIEWS: View[] = ['binder', 'list', 'trade', 'settings'];

function parse(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?');
  const [v, versionId] = path.split('/');
  const view = VIEWS.includes(v as View) ? (v as View) : 'binder';
  const p = Number(new URLSearchParams(query).get('p'));
  return { view, versionId: versionId || null, page: Number.isFinite(p) && p > 0 ? p - 1 : 0 };
}

export function toHash(r: Partial<Route> & { view: View }): string {
  let h = `#/${r.view}`;
  if (r.versionId && (r.view === 'binder' || r.view === 'list')) h += `/${r.versionId}`;
  if (r.view === 'binder' && r.page) h += `?p=${r.page + 1}`;
  return h;
}

let cachedHash = '';
let cachedRoute = parse('');
const getRoute = () => {
  if (location.hash !== cachedHash) {
    cachedHash = location.hash;
    cachedRoute = parse(cachedHash);
  }
  return cachedRoute;
};

const subscribe = (fn: () => void) => {
  window.addEventListener('hashchange', fn);
  window.addEventListener('popstate', fn);
  return () => {
    window.removeEventListener('hashchange', fn);
    window.removeEventListener('popstate', fn);
  };
};

export const useHashRoute = () => useSyncExternalStore(subscribe, getRoute);

/** replace: 履歴を積まない（ページめくり用） */
export function navigate(r: Partial<Route> & { view: View }, replace = false) {
  const hash = toHash(r);
  if (hash === location.hash) return;
  if (replace) history.replaceState(null, '', hash);
  else history.pushState(null, '', hash);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
