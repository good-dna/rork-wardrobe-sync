// Data layer types for offline-first architecture

export interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  lastSyncedAt?: number;
  isDirty?: boolean;
  isDeleted?: boolean;
}

export interface UserProfile extends BaseEntity {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phone?: string;
  location?: {
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  units: 'imperial' | 'metric';
}

export interface UserPreferences extends BaseEntity {
  uid: string;
  notifications: {
    outfitReminders: boolean;
    weatherAlerts: boolean;
    washingReminders: boolean;
    newFeatures: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  weatherFlags: {
    rain: boolean;
    wind: boolean;
    uv: boolean;
    humidity: boolean;
    pollen: boolean;
  };
  rules: WeatherRule[];
}

export interface WeatherRule {
  id: string;
  name: string;
  condition: {
    type: 'temperature' | 'precipitation' | 'uv' | 'humidity' | 'wind';
    operator: 'lt' | 'gt' | 'gte' | 'lte' | 'eq';
    value: number;
  };
  recommendationTags: string[];
  enabled: boolean;
}

export interface WeatherCacheEntry extends BaseEntity {
  uid: string;
  date: string; // YYYY-MM-DD
  daily: {
    high: number;
    low: number;
    precipProb: number;
    wind: number;
    humidity: number;
    uvIndex: number;
    sunrise: string;
    sunset: string;
    description: string;
    icon: string;
  };
  hourly: {
    time: string;
    temp: number;
    feelsLike: number;
    precipProb: number;
    wind: number;
    humidity: number;
    description: string;
    icon: string;
  }[];
}

// Sync operation types
export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  entityId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncResult {
  success: boolean;
  error?: string;
  conflicts?: ConflictResolution[];
}

export interface ConflictResolution {
  entityId: string;
  localVersion: number;
  serverVersion: number;
  resolution: 'local' | 'server' | 'merged';
  mergedFields?: string[];
}

// Cache interface
export interface CacheStore {
  get<T extends BaseEntity>(key: string): Promise<T | null>;
  set<T extends BaseEntity>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// Event types for telemetry
export type DataEvent = 
  | { type: 'profile_save_attempt'; entityId: string }
  | { type: 'profile_save_success'; entityId: string; duration: number }
  | { type: 'profile_save_fail'; entityId: string; error: string }
  | { type: 'cache_hit'; key: string }
  | { type: 'cache_miss'; key: string }
  | { type: 'sync_conflict'; entityId: string; resolution: string }
  | { type: 'sync_queue_add'; operationId: string }
  | { type: 'sync_queue_process'; operationId: string; success: boolean };

// Hook return types
export interface UseEntityResult<T extends BaseEntity> {
  data: T | null;
  save: (updates: Partial<T>) => Promise<void>;
  isDirty: boolean;
  isSyncing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseCacheResult {
  get: <T extends BaseEntity>(key: string) => Promise<T | null>;
  set: <T extends BaseEntity>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface UseSyncResult {
  sync: () => Promise<void>;
  isOnline: boolean;
  queueSize: number;
  lastSyncAt: number | null;
}