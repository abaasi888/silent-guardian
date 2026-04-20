import { openDB } from 'idb';
const dbPromise = openDB('silent-guardian', 1, { upgrade(db) { db.createObjectStore('offlineLocations'); } });
export const saveOfflineLocation = async (location) => { const db = await dbPromise; await db.add('offlineLocations', location); };
export const getOfflineLocations = async () => { const db = await dbPromise; return await db.getAll('offlineLocations'); };
