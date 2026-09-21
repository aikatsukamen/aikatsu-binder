import type { IndexJson, VersionMeta, WorkMeta } from './types';

/** version_id 下3桁が 700 以上はプロモ・特別弾として扱う */
export const isRegularVersion = (versionId: string) => Number(versionId.slice(-3)) < 700;

const byIdDesc = (a: string, b: string) => Number(b) - Number(a);

/** 作品ごとの弾一覧。作品・弾ともに新しい順 */
export function buildWorks(index: IndexJson): WorkMeta[] {
  const fileById = new Map(
    index.files.flatMap((f) => (f.kind === 'cards' && f.version_id ? [[f.version_id, f]] : [])) as [
      string,
      (typeof index.files)[number],
    ][],
  );
  const works = index.works.map((w) => ({
    work: w.work,
    versions: [...w.versions].sort(byIdDesc).map<VersionMeta>((id) => {
      const f = fileById.get(id);
      return {
        versionId: id,
        work: w.work,
        title: f?.series_title ?? id,
        count: f?.count ?? 0,
        hash: f?.hash ?? '',
        isRegular: isRegularVersion(id),
      };
    }),
  }));
  return works.sort((a, b) =>
    byIdDesc(a.versions[0]?.versionId ?? '0', b.versions[0]?.versionId ?? '0'),
  );
}

/** 初期表示: アンコールの最新の通常弾 */
export function defaultVersionId(works: WorkMeta[]): string | undefined {
  const encore = works.find((w) => w.work.includes('アンコール')) ?? works[0];
  return (encore?.versions.find((v) => v.isRegular) ?? encore?.versions[0])?.versionId;
}

/** 表示用の短い作品名 */
export const shortWork = (work: string) =>
  work.replace(/^アイカツ！?/, '').replace(/！$/, '') || '初代';
