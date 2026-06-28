import { deserializeSyncData, SyncData } from '@19nsj/schema';
import { getSetting } from './modules/db';

export async function fetchAndMergeSyncData(
    currentData: SyncData | null,
    onProgress: (percent: number) => void
): Promise<SyncData> {
    const savedEndpoint = await getSetting('api_endpoint');
    const apiEndpoint = savedEndpoint || 'http://localhost:8787/api/v1/sync.bin';
    
    // 1. クエリパラメータの構築（差分フェッチのため）
    const url = new URL(apiEndpoint);
    
    if (currentData) {
        if (currentData.weather?.updatedAt) {
            url.searchParams.set('weather_at', currentData.weather.updatedAt.toString());
        }
        
        if (currentData.news && currentData.news.length > 0) {
            const maxNewsId = Math.max(...currentData.news.map(n => n.id));
            url.searchParams.set('last_news_id', maxNewsId.toString());
        }
        
        if (currentData.events && currentData.events.length > 0) {
            const maxEventId = Math.max(...currentData.events.map(e => e.id));
            url.searchParams.set('last_event_id', maxEventId.toString());
        }
    }

    // 2. データの取得
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch sync data: ${response.status}`);
    }
    
    if (!response.body) {
        throw new Error('ReadableStream not supported by browser');
    }

    // ストリームを利用したプログレスの追跡
    const reader = response.body.getReader();
    // 差分パケットの場合は Content-Length が極端に小さい（あるいは不定）かもしれない
    const contentLength = +(response.headers.get('Content-Length') || '100');
    
    let receivedLength = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (value) {
            chunks.push(value);
            receivedLength += value.length;
            
            // プログレス計算（最大100%）
            const percent = Math.min(100, Math.round((receivedLength / contentLength) * 100));
            onProgress(percent);
            
            // 視覚的フィードバックのための微小な遅延（実用上は不要だがUX目的）
            await new Promise(resolve => setTimeout(resolve, 30));
        }
    }
    onProgress(100);

    // チャンクの結合
    const allChunks = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
        allChunks.set(chunk, position);
        position += chunk.length;
    }

    // バイナリをデコード（更新がないフィールドは null または空配列になる）
    const deltaData = deserializeSyncData(allChunks);

    // 3. ローカルデータとの安全なマージ
    if (!currentData) {
        // 初回フェッチの場合はそのまま返す
        return {
            timestamp: deltaData.timestamp || Date.now(),
            weather: deltaData.weather,
            news: deltaData.news || [],
            events: deltaData.events || []
        };
    }

    // 天気：サーバーから降ってきた場合は上書き、空（除外）の場合はローカルを維持
    const mergedWeather = deltaData.weather ? deltaData.weather : currentData.weather;

    // ニュース：新しいもの（差分）があれば既存リストに追加
    const mergedNews = [...currentData.news];
    if (deltaData.news && deltaData.news.length > 0) {
        mergedNews.push(...deltaData.news);
        // ID降順（新しいものが上）にソート
        mergedNews.sort((a, b) => b.id - a.id);
    }

    // イベント：新しいもの（差分）があれば既存リストに追加
    const mergedEvents = [...currentData.events];
    if (deltaData.events && deltaData.events.length > 0) {
        mergedEvents.push(...deltaData.events);
        // 開始時間昇順（時系列）にソート
        mergedEvents.sort((a, b) => a.startTime - b.startTime);
    }

    return {
        timestamp: deltaData.timestamp || Date.now(),
        weather: mergedWeather,
        news: mergedNews,
        events: mergedEvents
    };
}
