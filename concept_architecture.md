# 19NSJ オフラインファーストPWA 19nsj.camp 設計書

## 1. プロジェクト概要
第19回日本スカウトジャンボリー（19NSJ）の劣悪な通信環境（数kbps〜完全オフライン）において、参加スカウトおよび指導者が「絶対に情報にアクセスできる」ことを保証するサバイバル仕様のクライアントアプリ。

* ドメイン: 19nsj.camp
* アーキテクチャ方針:
  * 徹底したオフラインファースト（Service Workerによる鉄壁のキャッシュ）
  * 極小データ通信（画像・リッチメディアの排除、JSONテキストのみの同期）
  * フレームワークレス（素のブラウザAPIを直接叩き、ブラックボックスを排除）

---

## 2. 技術スタック
* フロントエンド: Vite + Vanilla TypeScript (HTML / CSS / TS)
  * ※型安全とエコシステムの恩恵を受けるため、Vite標準のVanilla TSテンプレートを採用。
* ローカルDB: IndexedDB (ラッパーとして超軽量な idb-keyval を採用推奨)
* PWA実装: 完全自作 Service Worker (sw.ts)
* バックエンド（プロキシ層）: Cloudflare Workers (またはCloudflare Tunnels経由の軽量サーバー)
  * 公式サイトやSNSをスクレイピングし、極小JSONに変換してエッジから配信。

---

## 3. ディレクトリ構成（Vite準拠）

19nsj-camp/
├── index.html          # エントリーポイント（スケルトンUIを直書き）
├── public/
│   ├── manifest.json   # PWAマニフェスト
│   ├── icons/          # アプリアイコン
│   └── map.svg         # オフラインマップ用ベクターデータ（超軽量）
├── src/
│   ├── main.ts         # メインロジック・UI制御
│   ├── sw.ts           # Service Worker（ビルド時にpublicへ出力させる）
│   ├── modules/
│   │   ├── db.ts       # IndexedDBの読み書きロジック
│   │   ├── api.ts      # ReadableStreamを使った超低速fetchロジック
│   │   ├── geo.ts      # Geolocation / DeviceOrientation 制御（コンパス）
│   │   └── ui.ts       # DOM操作・プログレスバー制御
│   └── styles/
│       └── style.css   # アプリケーション全体のスタイル（軽量化のためCSS変数活用）
├── package.json
└── tsconfig.json

---

## 4. コアモジュール設計

### 4.1 Service Worker (sw.ts) - 「ガワ」の防御
* インストール時 (install): index.html, style.css, main.js, map.svg を Cache Storage に事前キャッシュ。
* フェッチ時 (fetch):
  * アセット類: 完全に Cache First。ネットワークを一切見に行かず即座に返す。
  * APIリクエスト (/api/*): Network First。ただしタイムアウトを極端に短く（例: 3秒）設定し、失敗すれば即座にIndexedDBの古いデータを返す。

### 4.2 超低速同期ロジック (api.ts)
* ReadableStreamの活用: fetchで取得したレスポンスボディをストリームで読み込み、ui.ts に進行状況（バイト数）を随時イベントとして発火させる。
* 同期UI: 画面上部にミリ単位で進むプログレスバーを配置し、「通信中」のストレスを視覚的に軽減する。

### 4.3 オフラインコンパス＆マップ (geo.ts)
* 位置情報: navigator.geolocation.watchPosition でGPSを監視。
* 方位: window.addEventListener('deviceorientation') で端末の向きを取得。
* 描画: public/map.svg の上に、取得した緯度経度から計算した現在地ピンと、ジャイロから計算した矢印（CSSの transform: rotate(deg)）を重ねてオフラインナビゲーションを実現。

### 4.4 テキストプロキシサーバー（別リポジトリ/インフラ）
* エッジワーカー（Cloudflare Workers等）でcron処理を回し、19NSJ公式サイトの更新情報や天気を数十バイトのJSON配列に圧縮してホスティングする。
* エンドポイント例: https://api.19nsj.camp/v1/sync.json

---

## 5. 主要機能とユーザー体験（UX）

1. 爆速起動: 通信が圏外でも、ホーム画面のアイコンをタップしてから0.5秒でアプリが立ち上がり、前回のスケジュールが表示される。
2. 手動同期（フォアグラウンド同期）: ユーザーが明示的に「データ更新」ボタンを押す。プログレスバーが進み、数KBの最新JSONがマージされる。
3. 遭難防止コンパス: マップタブを開くと、通信ゼロで自分の現在地と「本部」への方角がリアルタイムに表示される。
4. 報告下書きフォーム: IndexedDBを活用し、入力中のテキストはすべて自動保存。送信失敗時もデータは消えない。

---


