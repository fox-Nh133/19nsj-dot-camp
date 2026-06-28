import { describe, expect, it } from 'vitest';
import worker from '../src/index';
import { deserializeSyncData } from '@19nsj/schema';

describe('19NSJ Backend Worker', () => {
	it('responds with active status text', async () => {
		const req = new Request('http://localhost/');
		const res = await worker.fetch(req, {}, {
			waitUntil: () => {},
			passThroughOnException: () => {},
		});
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('Edge Workers Active');
	});

	it('returns mock sync bin payload and decodes it correctly', async () => {
		const req = new Request('http://localhost/api/v1/sync.bin');
		const res = await worker.fetch(req, {}, {
			waitUntil: () => {},
			passThroughOnException: () => {},
		});
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toBe('application/octet-stream');
		const buffer = await res.arrayBuffer();
		expect(buffer.byteLength).toBeGreaterThan(0);

		// Test decoding
		const decoded = deserializeSyncData(new Uint8Array(buffer));
		expect(decoded.timestamp).toBeGreaterThan(0);
		expect(decoded.weather).not.toBeNull();
		expect(decoded.weather?.current?.temp).toBe(254);
		expect(decoded.weather?.tomorrow?.tempMax).toBe(280);
		expect(decoded.weather?.hourly?.temps.length).toBe(24);
		expect(decoded.weather?.hourly?.temps[23]).toBe(198);
		expect(decoded.news.length).toBe(2);
		expect(decoded.events.length).toBe(2);
		expect(decoded.events[0].title).toBe("Opening Ceremony");
	});
});
