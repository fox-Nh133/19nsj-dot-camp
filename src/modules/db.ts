import { get, set } from 'idb-keyval';

export async function setupDB() {
    console.log('IndexedDB ready via idb-keyval');
}

export async function saveDraft(text: string) {
    await set('report_draft', text);
}

export async function getDraft(): Promise<string> {
    const val = await get('report_draft');
    return val || '';
}
