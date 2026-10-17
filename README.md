# mochipo-web

Astro 7 (静的サイト) + Cloudflare Workers。ブログ / カテゴリー / 問い合わせフォーム。

- コンテンツ: `src/content/blog/*.md|mdx`(frontmatter は `src/content.config.ts` の Zod スキーマで検証)
- 問い合わせ API: `worker/index.ts`(`POST /api/contact`。Zod 検証 → Turnstile 検証 → Resend 送信)
- 配信: `wrangler.jsonc`(`dist/` を静的アセットとして配信し、`/api/*` だけ Worker が先に処理)

## ローカル開発

要件: Node 22 以上。

```sh
npm install
cp .env.example .env              # PUBLIC_TURNSTILE_SITE_KEY(テスト用キー入り)
cp .dev.vars.example .dev.vars    # Worker 用シークレット(テスト用キー入り)
```

### 1. 画面だけ確認する(フォームは送信不可)

```sh
npm run dev        # http://localhost:4321
```

`astro dev` は Worker を動かさないため、`/api/contact` は 404 になります。

### 2. フォームを含めて確認する(本番に近い構成)

```sh
npm run build
npx wrangler dev   # http://localhost:8787
```

`.dev.vars` の `ALLOWED_ORIGIN` が `http://localhost:8787` であることを確認してください(Origin チェックに使われます)。
画面を修正したら `npm run build` をやり直します。

Turnstile のテストキーはウィジェットが常に成功します。常に失敗させたい場合は、公式ドキュメントのテスト用キー(always-fail)に差し替えてください。

実際にメールを受け取るには `.dev.vars` の `RESEND_API_KEY` を本物にし、`wrangler.jsonc` の `CONTACT_FROM` を Resend で検証済みのドメインにします。
検証前のドメインでは、Resend の制限により自分のアカウント宛にしか送れません。ダミーのキーのままだと API は 502 を返します。

### API を curl で確認する

```sh
curl -s -X POST http://localhost:8787/api/contact \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:8787' \
  -d '{"name":"太郎","email":"a@example.com","message":"テストの問い合わせです。","turnstileToken":"dummy"}'
```

期待されるステータス: 入力不正 400 / Origin 不正 403 / Turnstile 失敗 403 / 送信失敗 502 / 成功 200。

## テスト・検証

```sh
npm test         # vitest: 入力スキーマ + Worker(Turnstile / Resend は fetch をモック)
npm run check    # astro check(型・コンテンツスキーマ)
npm run build    # 記事の frontmatter 不正はここで失敗する
```

## デプロイ(GitHub push → Cloudflare Workers Builds)

### 事前に差し替える値

| 場所 | 項目 |
|---|---|
| `src/consts.ts` | `SITE_URL`(canonical / sitemap / robots.txt に使われる) |
| `wrangler.jsonc` | `CONTACT_TO`, `CONTACT_FROM`, `ALLOWED_ORIGIN`(本番 URL) |
| `public/og-default.png` | OGP 既定画像(未作成) |

### 手順

1. Resend で送信ドメインを検証し、API キーを発行する。
2. Cloudflare の Turnstile でウィジェットを作成し、site key と secret key を取得する(ホスト名に本番ドメインを登録)。
3. Cloudflare ダッシュボードの Workers & Pages で GitHub リポジトリを接続する。
   - ビルドコマンド: `npm run build`
   - デプロイコマンド: `npx wrangler deploy`
   - ビルド変数: `PUBLIC_TURNSTILE_SITE_KEY`(ビルド時にフォームへ埋め込まれる)
4. シークレットを登録する。
   ```sh
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```
5. 以降は `master` への push で自動デプロイされる。

### 環境変数一覧

| 名前 | 種別 | 用途 |
|---|---|---|
| `RESEND_API_KEY` | secret | メール送信 |
| `TURNSTILE_SECRET_KEY` | secret | Turnstile 検証 |
| `PUBLIC_TURNSTILE_SITE_KEY` | ビルド変数 | フォームのウィジェット |
| `CONTACT_TO` | var | 受信先 |
| `CONTACT_FROM` | var | 送信元(Resend 検証済みドメイン) |
| `ALLOWED_ORIGIN` | var | Origin チェック用の本番 URL |
