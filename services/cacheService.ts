import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDB, IDBPDatabase } from 'idb';
import { BaseEntity, CacheStore } from '@/types/data';

// IndexedDB implementation for web
class IndexedDBCache implements CacheStore {
  private db: IDBPDatabase | null = null;
  private readonly dbName = 'WardrobeCache';
  private readonly version = 1;

  private async getDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entities')) {
          db.createObjectStore('entities');
        }
      },
    });

    return this.db;
  }

  async get<T extends BaseEntity>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const result = await db.get('entities', key);
      return result || null;
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  async set<T extends BaseEntity>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      await db.put('entities', value, key);
    } catch (error) {
      console.error('IndexedDB set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      await db.delete('entities', key);
    } catch (error) {
      console.error('IndexedDB remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      await db.clear('entities');
    } catch (error) {
      console.error('IndexedDB clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return await db.getAllKeys('entities') as string[];
    } catch (error) {
      console.error('IndexedDB keys error:', error);
      return [];
    }
  }
}

// AsyncStorage implementation for mobile
class AsyncStorageCache implements CacheStore {
  private readonly prefix = 'wardrobe_cache_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T extends BaseEntity>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('AsyncStorage get error:', error);
      return null;
    }
  }

  async set<T extends BaseEntity>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('AsyncStorage set error:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.error('AsyncStorage remove error:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('AsyncStorage keys error:', error);
      return [];
    }
  }
}

// Memory cache for fast access
class MemoryCache implements CacheStore {
  private cache = new Map<string, BaseEntity>();

  async get<T extends BaseEntity>(key: string): Promise<T | null> {
    return (this.cache.get(key) as T) || null;
  }

  async set<T extends BaseEntity>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }
}

// Multi-layer cache service
export class CacheService {
  private memoryCache = new MemoryCache();
  private persistentCache: CacheStore;

  constructor() {
    this.persistentCache = Platform.OS === 'web' 
      ? new IndexedDBCache() 
      : new AsyncStorageCache();
  }

  async get<T extends BaseEntity>(key: string): Promise<T | null> {
    // Try memory cache first
    let result = await this.memoryCache.get<T>(key);
    if (result) {
      this.logEvent({ type: 'cache_hit', key });
      return result;
    }

    // Try persistent cache
    result = await this.persistentCache.get<T>(key);
    if (result) {
      // Populate memory cache
      await this.memoryCache.set(key, result);
      this.logEvent({ type: 'cache_hit', key });
      return result;
    }

    this.logEvent({ type: 'cache_miss', key });
    return null;
  }

  async set<T extends BaseEntity>(key: string, value: T): Promise<void> {
    // Update both caches
    await Promise.all([
      this.memoryCache.set(key, value),
      this.persistentCache.set(key, value)
    ]);
  }

  async remove(key: string): Promise<void> {
    await Promise.all([
      this.memoryCache.remove(key),
      this.persistentCache.remove(key)
    ]);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.memoryCache.clear(),
      this.persistentCache.clear()
    ]);
  }

  async keys(): Promise<string[]> {
    return await this.persistentCache.keys();
  }

  private logEvent(event: { type: string; key: string }): void {
    console.log(`[Cache] ${event.type}: ${event.key}`);
  }
}

// Singleton instance
export const cacheService = new CacheService();