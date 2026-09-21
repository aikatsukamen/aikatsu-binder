import { useRef, useState, type ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { EXPORT_REMIND_DAYS, needsBackup } from '../domain/backup';
import { Sheet } from '../components/Sheet';
import { reloadMaster, useIndex } from '../data/master';
import {
  applyImport,
  buildExport,
  parseImport,
  useCollection,
  type Collection,
  type ImportMode,
} from '../store/collection';
import { patchSettings, useSettings, type PerPage, type ThemeSetting } from '../store/settings';

function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      className="flex rounded-full bg-white/60 p-1 dark:bg-white/10"
      role="radiogroup"
      aria-label={label}
    >
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className="flex-1 rounded-full px-3 py-1.5 text-sm aria-checked:bg-pink aria-checked:font-extrabold aria-checked:text-white"
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-panel p-4">
      <h2 className="mb-3 text-lg font-extrabold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="sm:w-48">
        <div>{label}</div>
        {hint && <div className="text-xs opacity-70">{hint}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })
    : 'まだありません';

export function SettingsView() {
  const perPage = useSettings((s) => s.perPage);
  const theme = useSettings((s) => s.theme);
  const lastExportAt = useSettings((s) => s.lastExportAt);
  const collection = useCollection();
  const index = useIndex();
  const entryCount = Object.keys(collection).length;
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Collection | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [message, setMessage] = useState<string | null>(null);

  const doExport = () => {
    const data = buildExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aikatsu-binder-${data.exportedAt.slice(0, 10).replaceAll('-', '')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    patchSettings({ lastExportAt: data.exportedAt });
    setMessage('書き出しました');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPending(parseImport(await file.text()));
      setMessage(null);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '読み込めませんでした');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (!pending) return;
    applyImport(pending, mode);
    setMessage(`${Object.keys(pending).length}件を取り込みました`);
    setPending(null);
  };

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-8 md:px-5">
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="outline-title px-1 text-3xl">設定</h1>

        <Section title="表示">
          <Field label="1ページの枚数">
            <Segmented<PerPage>
              label="1ページの枚数"
              value={perPage}
              options={[
                [4, '4枚（2×2）'],
                [9, '9枚（3×3）'],
              ]}
              onChange={(v) => patchSettings({ perPage: v })}
            />
          </Field>
          <Field label="テーマ">
            <Segmented<ThemeSetting>
              label="テーマ"
              value={theme}
              options={[
                ['auto', '端末に合わせる'],
                ['light', 'ライト'],
                ['dark', 'ダーク'],
              ]}
              onChange={(v) => patchSettings({ theme: v })}
            />
          </Field>
        </Section>

        <Section title="所持データ">
          <p className="text-sm opacity-80">
            データはこの端末のブラウザにだけ保存されます。機種変更やブラウザのデータ削除に備えて、ときどき書き出してください。
          </p>
          {needsBackup(lastExportAt, entryCount) && (
            <p className="rounded-2xl bg-want/20 px-3 py-2 text-sm">
              最後の書き出しから{EXPORT_REMIND_DAYS}日以上たっています。
            </p>
          )}
          <Field label="登録済みのカード" hint={`最後の書き出し: ${fmt(lastExportAt)}`}>
            <span className="font-extrabold tabular-nums">{entryCount}件</span>
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={doExport}
              className="flex items-center gap-1.5 rounded-full bg-pink px-5 py-2.5 font-extrabold text-white"
            >
              <Icon name="download" className="size-4" />
              書き出す
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full border-2 border-pink px-5 py-2 font-extrabold text-pink-d"
            >
              <Icon name="upload" className="size-4" />
              読み込む
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
          {message && (
            <p className="text-sm" role="status">
              {message}
            </p>
          )}
        </Section>

        <Section title="カード情報">
          <Field label="データの更新日時" hint="aikatsu-card-data から取得しています">
            <span>{index.status === 'ready' ? fmt(index.data.index.generated_at) : '—'}</span>
          </Field>
          <button
            type="button"
            onClick={reloadMaster}
            className="flex items-center gap-1.5 rounded-full border-2 border-pink px-5 py-2 font-extrabold text-pink-d"
          >
            <Icon name="refresh" className="size-4" />
            最新のカード情報を取得
          </button>
        </Section>
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="データを読み込む"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="flex-1 rounded-full border-2 border-pink py-2.5 font-extrabold text-pink-d"
            >
              やめる
            </button>
            <button
              type="button"
              onClick={confirmImport}
              className="flex-1 rounded-full bg-pink py-2.5 font-extrabold text-white"
            >
              {mode === 'merge' ? '合わせて読み込む' : '上書きして読み込む'}
            </button>
          </div>
        }
      >
        <p className="mb-4">
          ファイル内: <b className="tabular-nums">{pending ? Object.keys(pending).length : 0}件</b>
          ／ この端末: <b className="tabular-nums">{entryCount}件</b>
        </p>
        <Segmented<ImportMode>
          label="読み込み方"
          value={mode}
          options={[
            ['merge', '合わせる'],
            ['overwrite', '上書きする'],
          ]}
          onChange={setMode}
        />
        <p className="mt-3 text-sm opacity-80">
          {mode === 'merge'
            ? '同じカードは、所持・出・求それぞれ多いほうの数を残します。'
            : 'この端末のデータを消して、ファイルの内容に置き換えます。'}
        </p>
      </Sheet>
    </main>
  );
}
