import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openDB, IDBPDatabase } from 'idb';
import { BaseEntity, CacheStore } from '@/types/data';

// IndexedDB implementation for web
class IndexedDBCache implements CacheStore {
  private db: IDBPDatabase | null = null;
  private dbPromise: Promise<IDBPDatabase> | null = null;
  private readonly dbName = 'WardrobeCache';
  private readonly version = 1;

  private async getDB(): Promise<IDBPDatabase> {
    // If a connection is being established, wait for it
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        // Verify the connection is still valid
        if (db && db.objectStoreNames.contains('entities')) {
          return db;
        }
      } catch {
        // Connection failed, reset and retry
        this.db = null;
        this.dbPromise = null;
      }
    }

    // If we have an existing connection, try to use it
    if (this.db) {
      try {
        // Test if connection is alive by checking object stores
        if (this.db.objectStoreNames.contains('entities')) {
          return this.db;
        }
      } catch {
        // Connection is invalid, reset it
        this.db = null;
      }
    }

    // Create a new connection
    this.dbPromise = openDB(this.dbName, this.version, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('entities')) {
          db.createObjectStore('entities');
        }
      },
      blocked() {
        console.warn('IndexedDB blocked');
      },
      blocking() {
        console.warn('IndexedDB blocking');
      },
    });

    try {
      this.db = await this.dbPromise;
      return this.db;
    } catch (error) {
      this.db = null;
      this.dbPromise = null;
      throw error;
    }
  }

  async get<T extends BaseEntity>(key: string): Promise<T | null> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const db = await this.getDB();
        const result = await db.get('entities', key);
        return result || null;
      } catch (error: any) {
        console.error(`IndexedDB get error (attempt ${attempt + 1}):`, error);
        
        if (attempt === 0 && (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError')) {
          // Reset connection and retry
          this.db = null;
          this.dbPromise = null;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        return null;
      }
    }
    return null;
  }

  async set<T extends BaseEntity>(key: string, value: T): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const db = await this.getDB();
        await db.put('entities', value, key);
        return;
      } catch (error: any) {
        console.error(`IndexedDB set error (attempt ${attempt + 1}):`, error);
        
        if (attempt === 0 && (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError')) {
          // Reset connection and retry
          this.db = null;
          this.dbPromise = null;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        // Don't throw on set errors to prevent breaking the app
        return;
      }
    }
  }

  async remove(key: string): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const db = await this.getDB();
        await db.delete('entities', key);
        return;
      } catch (error: any) {
        console.error(`IndexedDB remove error (attempt ${attempt + 1}):`, error);
        
        if (attempt === 0 && (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError')) {
          this.db = null;
          this.dbPromise = null;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        return;
      }
    }
  }

  async clear(): Promise<void> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const db = await this.getDB();
        await db.clear('entities');
        return;
      } catch (error: any) {
        console.error(`IndexedDB clear error (attempt ${attempt + 1}):`, error);
        
        if (attempt === 0 && (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError')) {
          this.db = null;
          this.dbPromise = null;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        return;
      }
    }
  }

  async keys(): Promise<string[]> {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const db = await this.getDB();
        return await db.getAllKeys('entities') as string[];
      } catch (error: any) {
        console.error(`IndexedDB keys error (attempt ${attempt + 1}):`, error);
        
        if (attempt === 0 && (error?.name === 'InvalidStateError' || error?.name === 'TransactionInactiveError')) {
          this.db = null;
          this.dbPromise = null;
          await new Promise(resolve => setTimeout(resolve, 50));
          continue;
        }
        
        return [];
      }
    }
    return [];
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