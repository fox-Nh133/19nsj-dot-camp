import { get, set } from 'idb-keyval';

export async function setupDB() {
    console.log('IndexedDB ready via idb-keyval');
}

export async function saveSetting(key: string, value: string) {
    await set(`setting_${key}`, value);
}

export async function getSetting(key: string): Promise<string | undefined> {
    return await get(`setting_${key}`);
}
