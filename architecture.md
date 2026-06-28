# 19NSJ オフラインファーストPWA 19nsj.camp 設計書

## 1. プロジェクト概要
第19回日本スカウトジャンボリー（19NSJ）の劣悪な通信環境（数kbps〜完全オフライン）において、参加スカウトおよび指導者が「絶対に情報にアクセスできる」ことを保証するサバイバル仕様のクライアントアプリ。

* ドメイン: 19nsj.camp
* アーキテクチャ方針:
  * 徹底したオフラインファースト（Service Workerによる鉄壁のキャッシュ）
  * 極小データ通信（画像・リッチメディアの排除、Protobufによる極小バイナリ同期）
  * 軽量かつ保守性の高いコンポーネント設計（Preactによるコンポーネント分割）
  * モノレポ構成（フロントエンド・バックエンド・テストコードの一元管理）

---

## 2. 技術スタック
* フロントエンド: Vite + Preact + TypeScript (HTML / CSS / TSX)
  * ※軽量さ（~3KB）と可読性・保守性のバランスを考慮し、Preactを採用。
* マップ: Leaflet.js + OpenStreetMap
  * ※オフラインでの画像欠損に対応するため、マーカーはHTML/CSSベースの軽量カスタムアイコン（L.divIcon）を使用。
* アイコン: Bootstrap Icons
* ローカルDB: IndexedDB (ラッパーとして idb-keyval を採用)
* PWA実装: 自作 Service Worker (packages/client/public/sw.js)
* バックエンド: Cloudflare Workers (TypeScript)
  * 公式サイトやSNSをスクレイピングし、Protobufバイナリに変換してエッジから配信。
  * wrangler および vitest によるテスト・開発環境。

---

## 3. ディレクトリ構成（モノレポ構造）

19nsj-camp/
├── package.json           # ルートpackage.json（Workspaces定義）
├── architecture.md        # 本設計書
├── packages/
│   ├── client/            # フロントエンド（PWA）
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── public/
│   │   │   ├── manifest.json
│   │   │   └── sw.js      # Service Worker
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── components/
│   │       │   ├── Header.tsx
│   │       │   ├── BottomNav.tsx
│   │       │   └── views/
│   │       │       ├── HomeView.tsx
│   │       │       ├── ScheduleView.tsx # タイムスケジュール
│   │       │       ├── MapView.tsx
│   │       │       └── SettingsView.tsx # アプリケーション設定（新規）
│   │       ├── modules/
│   │       │   └── db.ts       # 設定データ保持ロジック
│   │       └── styles/
│   │           └── style.css
│   ├── backend/           # バックエンド（Cloudflare Workers）
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── index.ts   # エッジワーカーエントリーポイント（API配信）
│   │   └── test/
│   │       └── index.test.ts # ローカルテストコード
│   └── schema/            # スキーマ定義・エンコーダデコーダ（共有パッケージ）
│       ├── package.json
│       ├── tsconfig.json
│       ├── proto/
│       │   └── sync.proto # Protobuf定義
│       └── src/
│           └── index.ts   # pbfを利用したTS用エンコーダデコーダ
└── package-lock.json

---

## 4. コアモジュール・通信設計

### 4.1 Service Worker (sw.js) - 「ガワ」の防御とAPIフォールバック
* インストール時 (install): 必要アセットを Cache Storage に事前キャッシュ。
* フェッチ時 (fetch):
  * アセット類: 完全に Cache First。
  * APIリクエスト (`/api/v1/sync.bin`): Network First。ただしタイムアウトを極端に短く（3秒）設定し、失敗すれば即座にIndexedDBのキャッシュを返す。

### 4.2 データ同期・配信方式仕様（スマート・シングルエンドポイント / 差分フェッチ）
数kbps〜数百kbpsという極限の低帯域・高レイテンシ環境において、ハンドシェイクのオーバーヘッドを削ぎ落とし、1パケットでも確実にデータを届けるための通信仕様。
従来の静的フルスナップショット配信から、HTTP/3 (QUIC) の単一リクエストの堅牢性を活かしつつ、更新のないフィールドを動的に間引く「差分フェッチ」へ移行した。

#### 4.2.1 プロトコルレイヤー（HTTP/3の強制）
UDPベースのHTTP/3（QUIC）を通信プロトコルとして強制する。これによりTCPにおける「ヘッドオブラインブロッキング」を回避し、タイムアウトを抑制する。
* **インフラ側の対応**: バックエンド（Cloudflare Workers等）のエッジサーバー側でHTTP/3配信を常時有効化する。
* **通信効率化の恩恵**:
  * **0-RTT / 1-RTT 接続**: TCPの3ウェイ・ハンドシェイクおよびTLS鍵交換の往復（RTT）を排除・最小化。電波が一瞬繋がった瞬間にデータを取得可能とする。
  * **接続の生存性**: 基地局が切り替わっても、QUICのConnection IDによりコネクションを再確立することなく通信を継続する。

#### 4.2.2 ペイロードレイヤー（Protocol Buffersによる差分バイナリ配信）
JSON等のテキストフォーマットはキー文字列のオーバーヘッドが大きいため採用しない。すべてのデータはProtocol Buffers（Protobuf）によってシリアライズされた極小のバイナリデータ（`.bin`）として配信・受信する。

**スマート・シングルエンドポイントの挙動:**
* エンドポイント: `GET /api/v1/sync.bin?weather_at={UNIX時間}&last_news_id={ID}&last_event_id={ID}`
* クライアントはローカルDB（IndexedDB）が保持している最新のタイムスタンプやIDをクエリパラメータとして送信する。
* バックエンド（Cloudflare Workers）はパラメータを解析し、更新がないデータはProtobufのメッセージフィールドごと「空（Null/省略）」にしてバイナリから完全に除外する。
* これにより、ニュース1件のみの更新時は数十バイトの極小パケットのみが生成され、MTUに余裕で収まるサイズで物理層を1パケットで通過する。

1. **スキーマ定義（.proto）の基本方針**
   * フィールド番号で識別するため、スキーマ定義のキー文字列はパケットに乗らない。
   * 数値（列挙型、タイムスタンプ、ステータス）は可変長整数（Varint）としてエンコードされ、1〜数バイトに圧縮される。
   * 差分フェッチの恩恵を最大化するため、未更新の構造体はエンコード処理から除外する設計とする。
2. **通信データ構造**
   ```proto
   syntax = "proto3";

   package sync;

   enum WeatherCode {
     UNKNOWN = 0;
     CLEAR = 1;       // 晴れ
     CLOUDY = 2;      // 曇り
     RAIN = 3;        // 雨
     HEAVY_RAIN = 4;  // 大雨（警戒レベル）
     THUNDER = 5;     // 雷
   }

   message SyncData {
     uint64 timestamp = 1;      // 同期時刻（Varint圧縮）
     WeatherData weather = 2;   // 天気情報
     repeated News news = 3;    // ニュース配列（極小テキストのみ）
     repeated Event events = 4; // イベント/タイムスケジュール配列
   }

   message WeatherData {
     uint64 updated_at = 1;     // 予報の発表時刻（UNIXタイムスタンプ）
     CurrentWeather current = 2;
     TomorrowForecast tomorrow = 3;
     HourlyForecast hourly = 4;
   }

   // 1. 今の気象情報
   message CurrentWeather {
     WeatherCode code = 1;
     sint32 temp = 2;           // 気温 (℃ * 10) 例: 25.4℃ -> 254
     uint32 humidity = 3;       // 湿度 (%)
     uint32 precip = 4;         // 降水量 (mm * 10) 例: 1.5mm -> 15
     uint32 wind_speed = 5;     // 風速 (m/s * 10) 例: 3.2m/s -> 32
   }

   // 2. 明日の天気予報
   message TomorrowForecast {
     WeatherCode code = 1;
     sint32 temp = 2;           // 平均気温 (℃ * 10)
     sint32 temp_max = 3;       // 最高気温 (℃ * 10)
     sint32 temp_min = 4;       // 最低気温 (℃ * 10)
     uint32 pop = 5;            // 降水確率 (%)
     uint32 precip = 6;         // 降水量予報 (mm * 10)
     uint32 wind_speed = 7;     // 最大風速 (m/s * 10)
   }

   // 3. 1時間天気（Struct of Arraysによるpacked圧縮）
   message HourlyForecast {
     uint64 start_time = 1;     // 配列の[0]に該当する時間のUNIXタイムスタンプ
     repeated WeatherCode codes = 2;
     repeated sint32 temps = 3;
     repeated uint32 humidities = 4;
     repeated uint32 pops = 5;
     repeated uint32 precips = 6;
     repeated uint32 wind_speeds = 7;
   }

   message News {
     uint64 id = 1;
     uint64 created_at = 2;
     string title = 3;
   }

   // イベント/タイムスケジュール構造
   message Event {
     uint64 id = 1;
     string title = 2;          // イベント名
     uint64 start_time = 3;     // 開始時刻（UNIXタイムスタンプ）
     uint64 end_time = 4;       // 終了時刻（UNIXタイムスタンプ）
     string location = 5;       // 場所
     string description = 6;    // 詳細説明
   }
   ```

### 4.3 クライアントサイド実装要求
1. **ReadableStreamとプログレスバーの連動**
   * fetchで取得したレスポンスボディ（Protobufバイナリ）は、一括でメモリに載せるのではなく、ReadableStreamを利用してチャンク単位で読み込む。
   * 読み込んだバイト数をリアルタイムにUIへ通知し、画面上のミリ単位で進むプログレスバーを駆動させることで、「通信が死んでいない（少しずつでもバイナリが届いている）」ことをスカウトに視覚的に伝える。
2. **バイナリデコードとローカル保存**
   * ストリームの読み込み完了後、JavaScript（Preact側）に組み込んだ超軽量なProtobufデコーダー（例: `pbf`）を用いて、バイナリを瞬時にオブジェクトに復元する。
   * 復元したデータは直ちにIndexedDB（idb-keyval）へマージし、次回の完全オフライン起動時に備える。

---

## 5. 主要機能とユーザー体験（UX）
1. **爆速起動**: 通信が圏外でも、ホーム画面のアイコンをタップしてから0.5秒でアプリが立ち上がり、前回のスケジュールが表示される。
2. **手動同期（フォアグラウンド同期）**: ユーザーが明示的に「データ更新」ボタンを押す。プログレスバーが進み、数KBの最新Protobufバイナリがマージされる。
3. **タイムスケジュール（Scheduleタブ）**: 同期したイベント（開始・終了時間、開催地、内容）をタイムライン表示し、オフラインでも自身の行動予定を即座に確認できる。
4. **設定カスタマイズ（Settingsタブ）**:
   * **同期先エンドポイント変更**: LoRaキオスクなどのローカル通信機器（Wi-Fi / 192.168.4.1等）にデータ同期先を切り替えることができる（拡張設計に対応）。
   * **高精度GPS制御**: バッテリーを節約するために、GPSの検知精度（watchPosition）を切り替えられる。
   * **ストレージキャッシュクリア**: オフラインキャッシュやIndexedDBの蓄積データを一括削除できる。
5. **遭難防止コンパス/マップ**: マップタブを開くと、通信ゼロで自分の現在地がリアルタイムに表示される。
