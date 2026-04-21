import { openDB } from 'idb';
import pako from 'pako';

const DB_NAME = 'silent-guardian';
const DB_VERSION = 2;
const STORE_NAME = 'offlineLocations';

let dbPromise = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { autoIncrement: true });
          store.createIndex('timestamp', 'timestamp');
        }
      }
    });
  }
  return dbPromise;
};

const compress = async (data) => {
  const json = JSON.stringify(data);
  return pako.deflate(json);
};

const decompress = async (compressed) => {
  const json = pako.inflate(compressed, { to: 'string' });
  return JSON.parse(json);
};

export const saveOfflineLocation = async (location) => {
  const db = await getDB();
  const compressed = await compress(location);
  await db.add(STORE_NAME, { compressed, timestamp: location.timestamp || Date.now() });
};

export const getOfflineLocations = async () => {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  const results = [];
  for (const item of all) {
    const decompressed = await decompress(item.compressed);
    results.push(decompressed);
  }
  return results;
};

export const clearOfflineLocations = async () => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
};

export const getOfflineCount = async () => {
  const db = await getDB();
  return await db.count(STORE_NAME);
};
