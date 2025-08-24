import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  BaseEntity, 
  SyncOperation, 
  SyncResult, 
  ConflictResolution,
  DataEvent 
} from '@/types/data';
import { cacheService } from './cacheService';
import { trpcClient } from '@/lib/trpc';

export class SyncService {
  private syncQueue: SyncOperation[] = [];
  private isOnline = true;
  private isSyncing = false;
  private lastSyncAt: number | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private readonly queueKey = 'sync_queue';
  private readonly maxRetries = 5;
  private readonly retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
    this.startPeriodicSync();
  }

  private initializeNetworkListener(): void {
    if (Platform.OS === 'web') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processSyncQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
      
      this.isOnline = navigator.onLine;
    } else {
      // For React Native, we'll assume online by default
      // In a real app, you'd use @react-native-netinfo/netinfo
      this.isOnline = true;
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.queueKey);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private startPeriodicSync(): void {
    // Sync every 15 minutes
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.processSyncQueue();
      }
    }, 15 * 60 * 1000);
  }

  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void> {
    const syncOp: SyncOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.maxRetries,
    };

    this.syncQueue.push(syncOp);
    await this.saveSyncQueue();
    
    this.logEvent({ type: 'sync_queue_add', operationId: syncOp.id });

    // Try to process immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.processSyncQueue();
    }
  }

  async processSyncQueue(): Promise<void> {
    if (this.isSyncing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.isSyncing = true;
    console.log(`[Sync] Processing ${this.syncQueue.length} operations`);

    const processedOperations: string[] = [];

    for (const operation of this.syncQueue) {
      try {
        const result = await this.processOperation(operation);
        
        if (result.success) {
          processedOperations.push(operation.id);
          this.logEvent({ 
            type: 'sync_queue_process', 
            operationId: operation.id, 
            success: true 
          });
        } else {
          operation.retryCount++;
          
          if (operation.retryCount >= operation.maxRetries) {
            console.error(`[Sync] Operation ${operation.id} failed after ${operation.maxRetries} retries`);
            processedOperations.push(operation.id); // Remove from queue
          } else {
            // Schedule retry with exponential backoff
            const delay = this.retryDelays[Math.min(operation.retryCount - 1, this.retryDelays.length - 1)];
            setTimeout(() => {
              if (this.isOnline && !this.isSyncing) {
                this.processSyncQueue();
              }
            }, delay);
          }
          
          this.logEvent({ 
            type: 'sync_queue_process', 
            operationId: operation.id, 
            success: false 
          });
        }
      } catch (error) {
        console.error(`[Sync] Error processing operation ${operation.id}:`, error);
        operation.retryCount++;
        
        if (operation.retryCount >= operation.maxRetries) {
          processedOperations.push(operation.id);
        }
      }
    }

    // Remove processed operations from queue
    this.syncQueue = this.syncQueue.filter(op => !processedOperations.includes(op.id));
    await this.saveSyncQueue();

    this.lastSyncAt = Date.now();
    this.isSyncing = false;
  }

  private async processOperation(operation: SyncOperation): Promise<SyncResult> {
    try {
      switch (operation.entity) {
        case 'profile':
          return await this.syncProfile(operation);
        case 'preferences':
          return await this.syncPreferences(operation);
        case 'weatherCache':
          return await this.syncWeatherCache(operation);
        default:
          throw new Error(`Unknown entity type: ${operation.entity}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncProfile(operation: SyncOperation): Promise<SyncResult> {
    try {
      switch (operation.type) {
        case 'create':
        case 'update':
          // Check for conflicts
          const serverProfile = await trpcClient.profile.get.query({ id: operation.entityId });
          const localProfile = operation.data;

          if (serverProfile && serverProfile.version > localProfile.version) {
            // Conflict detected - merge changes
            const resolution = this.resolveConflict(localProfile, serverProfile);
            const mergedProfile = this.mergeEntities(localProfile, serverProfile, resolution.mergedFields || []);
            
            // Update server with merged data
            await trpcClient.profile.update.mutate(mergedProfile);
            
            // Update local cache
            await cacheService.set(`profile:${operation.entityId}`, mergedProfile);
            
            this.logEvent({ 
              type: 'sync_conflict', 
              entityId: operation.entityId, 
              resolution: resolution.resolution 
            });

            return {
              success: true,
              conflicts: [resolution],
            };
          } else {
            // No conflict - update server
            const updatedProfile = await trpcClient.profile.update.mutate(localProfile);
            await cacheService.set(`profile:${operation.entityId}`, updatedProfile);
            
            return { success: true };
          }

        case 'delete':
          await trpcClient.profile.delete.mutate({ id: operation.entityId });
          await cacheService.remove(`profile:${operation.entityId}`);
          return { success: true };

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile sync failed',
      };
    }
  }

  private async syncPreferences(operation: SyncOperation): Promise<SyncResult> {
    try {
      switch (operation.type) {
        case 'create':
        case 'update':
          const serverPrefs = await trpcClient.preferences.get.query({ id: operation.entityId });
          const localPrefs = operation.data;

          if (serverPrefs && serverPrefs.version > localPrefs.version) {
            const resolution = this.resolveConflict(localPrefs, serverPrefs);
            const mergedPrefs = this.mergeEntities(localPrefs, serverPrefs, resolution.mergedFields || []);
            
            await trpcClient.preferences.update.mutate(mergedPrefs);
            await cacheService.set(`preferences:${operation.entityId}`, mergedPrefs);
            
            return {
              success: true,
              conflicts: [resolution],
            };
          } else {
            const updatedPrefs = await trpcClient.preferences.update.mutate(localPrefs);
            await cacheService.set(`preferences:${operation.entityId}`, updatedPrefs);
            
            return { success: true };
          }

        case 'delete':
          await trpcClient.preferences.delete.mutate({ id: operation.entityId });
          await cacheService.remove(`preferences:${operation.entityId}`);
          return { success: true };

        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Preferences sync failed',
      };
    }
  }

  private async syncWeatherCache(operation: SyncOperation): Promise<SyncResult> {
    // Weather cache is typically read-only from external APIs
    // Just update local cache
    try {
      await cacheService.set(`weather:${operation.entityId}`, operation.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Weather cache sync failed',
      };
    }
  }

  private resolveConflict<T extends BaseEntity>(local: T, server: T): ConflictResolution {
    // Simple last-writer-wins with field-level merge
    // In a real app, you might want more sophisticated conflict resolution
    const mergedFields: string[] = [];
    
    // Compare updatedAt timestamps for each field
    // This is a simplified approach - in practice you'd track field-level changes
    if (local.updatedAt > server.updatedAt) {
      // Local is newer - keep local changes for most fields
      mergedFields.push('displayName', 'email', 'phone', 'location', 'units');
    }

    return {
      entityId: local.id,
      localVersion: local.version,
      serverVersion: server.version,
      resolution: 'merged',
      mergedFields,
    };
  }

  private mergeEntities<T extends BaseEntity>(local: T, server: T, mergedFields: string[]): T {
    const merged = { ...server }; // Start with server version
    
    // Override with local changes for specified fields
    for (const field of mergedFields) {
      if (field in local) {
        (merged as any)[field] = (local as any)[field];
      }
    }
    
    // Update metadata
    merged.version = Math.max(local.version, server.version) + 1;
    merged.updatedAt = Date.now();
    merged.lastSyncedAt = Date.now();
    merged.isDirty = false;
    
    return merged;
  }

  private logEvent(event: DataEvent): void {
    console.log(`[Sync] ${event.type}:`, event);
    // In a real app, you'd send this to your analytics service
  }

  // Public API
  getQueueSize(): number {
    return this.syncQueue.length;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  getLastSyncAt(): number | null {
    return this.lastSyncAt;
  }

  async forcSync(): Promise<void> {
    if (!this.isSyncing) {
      await this.processSyncQueue();
    }
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Singleton instance
export const syncService = new SyncService();