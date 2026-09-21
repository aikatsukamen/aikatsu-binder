# アイカツカードバインダー

アイカツカードの所持・交換（求／出）をバインダー風に管理する Web アプリ。
カード情報は [aikatsu-card-data](https://github.com/aikatsukamen/aikatsu-card-data) を GitHub Pages から直接読み込み、所持データはブラウザ（localStorage）にのみ保存する。

## 開発

VS Code の「Reopen in Container」で devcontainer を起動するか、Node.js 22 以上で:

```sh
npm ci
npm run dev        # http://localhost:5173
npm run check      # 型チェック + ESLint + Prettier チェック
npm run build
```

保存時に Prettier（Tailwind のクラス順ソート込み）と ESLint の自動修正が走る（`.vscode/settings.json`）。

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が `check` → `build` → GitHub Pages デプロイを行う。
リポジトリの Settings → Pages → Source を「GitHub Actions」にしておくこと。
ハッシュルーティング + `base: './'` なので、リポジトリ名に依存しない。

## 構成

```
src/
  domain/      型・レアリティ順・絞り込み/並び替え・弾の判定（React 非依存）
  data/        マスターデータ取得（index.json の hash でキャッシュ更新）
  store/       所持データ・設定（localStorage 永続化）
  hooks/       ハッシュルーティング、テーマ、要素サイズ
  components/  バインダー（めくり）、ポケット、シート類
  views/       バインダー／一覧／交換／設定の各画面
```

## 仕様メモ

- 所持データのキーは `version_id:card_id`。同じ弾に同一 `card_id` が複数あれば1枚扱い。
- レアリティ順: N < R = FR = CP < PR = BFR < JLR = SPR = LPR = SEC = ER（`src/domain/rarity.ts`）。
- 初期表示: アンコールの最新の通常弾。`version_id` 下3桁が 700 以上はプロモ・特別弾として除外。
- URL: `#/binder/629001?p=3`、`#/list/629001`、`#/trade`、`#/settings`。
- エクスポート形式: `{ app: "aikatsu-binder", schema: 1, exportedAt, entries: { "629001:E1-05": { own, give, want } } }`
