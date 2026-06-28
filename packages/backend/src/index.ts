import { serializeSyncData, SyncData } from '@19nsj/schema';
// text module import using wrangler's [[rules]]
import mockDataRaw from './mockData.jsonc';

export interface Env {}

/**
 * A minimal JSONC parser that strips single-line and multi-line comments
 * before parsing with JSON.parse.
 */
function parseJsonc<T>(jsoncString: string): T {
	// Strip single line comments (// ...) and multi-line comments (/* ... */)
	// Note: This simple regex does not handle comments inside strings perfectly, 
	// but is sufficient for our simple mock data configuration.
	const jsonString = jsoncString.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
	
	// Also handle potential trailing commas before closing braces/brackets
	const cleanJsonString = jsonString.replace(/,\s*([\]}])/g, '$1');
	
	return JSON.parse(cleanJsonString);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "GET, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		if (url.pathname === "/api/v1/sync.bin") {
			try {
				// Parse the human-readable JSONC at runtime.
				const syncData = parseJsonc<SyncData>(mockDataRaw);

				// 差分フェッチ（Smart Single Endpoint）の処理
				// クライアントが保持している最新のタイムスタンプ/IDを取得
				const weatherAt = parseInt(url.searchParams.get("weather_at") || "0", 10);
				const lastNewsId = parseInt(url.searchParams.get("last_news_id") || "0", 10);
				const lastEventId = parseInt(url.searchParams.get("last_event_id") || "0", 10);

				// 1. 天気データ: クライアントが既に最新を持っている場合は除外
				if (syncData.weather && syncData.weather.updatedAt <= weatherAt) {
					syncData.weather = null;
				}

				// 2. ニュースデータ: クライアントが持っていない新しいものだけを抽出
				if (syncData.news && syncData.news.length > 0) {
					syncData.news = syncData.news.filter(n => n.id > lastNewsId);
				}

				// 3. イベントデータ: クライアントが持っていない新しいものだけを抽出
				if (syncData.events && syncData.events.length > 0) {
					syncData.events = syncData.events.filter(e => e.id > lastEventId);
				}

				// Serialize to sparse protobuf binary
				const binary = serializeSyncData(syncData);

				return new Response(binary, {
					headers: {
						"content-type": "application/octet-stream",
						"Content-Length": String(binary.length),
						"Access-Control-Allow-Origin": "*",
					},
				});
			} catch (error: any) {
				return new Response(`Error parsing sync data: ${error.message}`, {
					status: 500,
					headers: {
						"content-type": "text/plain",
						"Access-Control-Allow-Origin": "*",
					}
				});
			}
		}

		return new Response("19NSJ API Proxy Edge Workers Active", {
			headers: { "content-type": "text/plain" },
		});
	},
};
