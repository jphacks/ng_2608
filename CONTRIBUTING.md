# 共同開発ガイド

現在のアプリは **`codex/privacy-review-gate` ブランチの `web/`** にあります。`main` にはまだ統合していません。

初めて参加する人は [起動とAPI設定](docs/GETTING_STARTED.md) → [実装・担当ファイル](docs/ARCHITECTURE.md) の順に読んでください。

## 権限と進め方

- ソースの閲覧・取得と、リポジトリへのpush権限は別です。チームの管理者にGitHubアカウントを伝え、このリポジトリへの書き込み権限を設定してもらってください。
- GitHubの権限と公開サイトの編集権限も別です。GitHubだけ参加する人は、まずローカル開発できます。
- 各自の作業ブランチを作り、当面は `codex/privacy-review-gate` を取り込み先にします。
- `main` への統合はチームでレビューしてから行ってください。

## 作業の例

以下はリポジトリのルートで実行します。`feature/profile-layout` は自分の作業名に変えてください。

```sh
git switch codex/privacy-review-gate
git pull --ff-only origin codex/privacy-review-gate
git switch -c feature/profile-layout
```

編集と確認後：

```sh
cd web
npm test
cd ..
git status --short
# 変更したファイルだけ指定する。以下は画面変更の例。
git add web/public/demo/experience.js web/public/demo/pink.css
git commit -m "Improve profile layout"
git push -u origin feature/profile-layout
```

GitHubでPull Requestを作り、**baseを `codex/privacy-review-gate`、compareを自分のブランチ**にします。
この案内の追加時点では、アプリ全体を `main` に統合するPRは未作成です。

## レビューに添えること

- どの操作で何が変わるか。UIなら変更後のスクリーンショット。
- 実行した確認と結果。未確認の点はそのまま書く。
- 個人情報や写真の保存・AI送信先を変えた場合、その変更内容。
- DB変更なら追加した移行ファイルと既存データへの影響。

## 開発の約束

- 通常のチャットに確認モーダルを追加しない。検出時の通知と任意の詳細確認を基本にする。
- 公開名と氏名を分離し、非公開項目を一般プロフィールの応答に混ぜない。
- 原文や元の写真を外部AIへ渡さない。新たなAI処理は加工前後の境界を確認する。
- 年収は任意・初期設定は非公開。相性スコアへ勝手に追加しない。
- 相性をマッチ確率や科学的な性格診断と呼ばない。
- `.env.local`、APIキー、ローカルDB、実際の利用者の会話・写真をcommitしない。
- 既存のSQL移行は書き換えず、新しい移行を追加する。
- 画面の関数を変える前に、`experience.js` / `questionnaire-ui.js` の上書きも確認する。

確認方法は [検証と困ったとき](docs/TESTING.md)、公開方法は [公開と運用](docs/DEPLOYMENT.md) にあります。
